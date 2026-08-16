// scripts/ingestPatch.ts
//
// Pulls the latest item catalog, hero catalog, steam build info and patch-note
// feed, diffs the catalogs against the copies already committed in app/data,
// and writes the precomputed artifacts the site renders.
//
// Two invariants that were real bugs during planning:
//   1. Never send `client_version` - omitting it returns latest (verified
//      byte-identical to an explicit pin).
//   2. The diff runs on FULL payloads. Diffing trimmed views was measured to
//      lose 7 of 27 real changes. Trimming applies only to the *-view.json
//      files shipped to the browser.

import fs from "node:fs";
import path from "node:path";
import {
	type Change,
	generateDeadlockPatchDiff,
	hasAnyChange,
	type PrunedNode,
	pruneUnmodified,
	summarize,
} from "../app/utils/diffEngine";
import { sanitizeNotesHtml } from "../app/utils/sanitizeHtml";
import {
	generalHtml,
	hasGeneralContent,
	titleDate,
} from "../app/utils/noteSections";
import { diffItems } from "../app/utils/tooltipProjection";
import {
	diffAbilityTiers,
	type TierDiff,
} from "../app/utils/abilityUpgrades";
import { isLiveHero } from "../app/utils/roster";
import type { Item } from "../app/types";

const API = "https://api.deadlock-api.com";
const DATA_DIR = path.join(process.cwd(), "app", "data");

// Hero ability slots that a hero card renders. `weapon_melee` and the
// `ability_*` movement slots are shared across heroes and never patch-notable.
//
// `weapon_primary` is kept separate: it resolves to a pseudo-ability (no
// localised name, no `ability_type`, three permanently empty tiers) and is not
// an ability - see the matching split in patchService.ts. `SLOTS` (the union)
// still feeds `buildItemsView`/`buildAbilityTiers`, which only need "every
// class a hero card could reference" and are unaffected either way;
// `countChangedHeroes` must mirror `getChangedHeroes()`'s predicate exactly or
// the nav badge stops matching the number of cards actually rendered.
const WEAPON_SLOT = "weapon_primary";
const ABILITY_SLOTS = ["signature1", "signature2", "signature3", "signature4"];
const SLOTS = [WEAPON_SLOT, ...ABILITY_SLOTS];

const SHOP_FIELDS = [
	"id",
	"class_name",
	"name",
	"shop_image_webp",
	"shop_image",
	"item_slot_type",
	"item_tier",
	"cost",
	"activation",
	"is_active_item",
	"properties",
	"tooltip_sections",
	"description",
	"component_items",
];

const ABILITY_FIELDS = [
	"id",
	"class_name",
	"name",
	"image_webp",
	"image",
	"hero",
	"ability_type",
	"properties",
	"tooltip_details",
	"description",
	"upgrades",
];

const HERO_VIEW_FIELDS = [
	"id",
	"class_name",
	"name",
	"images",
	"starting_stats",
	"items",
	"standard_level_up_upgrades",
	"colors",
	"player_selectable",
	"disabled",
	"in_development",
];

/** Every file `ingest()` writes. Used to detect a missing artifact. */
const ARTIFACTS = [
	"item-changes.json",
	"ability-tiers.json",
	"latest-patch.json",
	"latest-heroes.json",
	"latest-diff.json",
	"latest-hero-diff.json",
	"items-view.json",
	"heroes-view.json",
	"patch-notes.json",
	"patch-meta.json",
];

type Json = Record<string, unknown>;

const pick = (obj: Json, fields: string[]): Json => {
	const out: Json = {};
	for (const field of fields) {
		if (Object.hasOwn(obj, field)) out[field] = obj[field];
	}
	return out;
};

function readJsonOr<T>(file: string, fallback: T): T {
	const full = path.join(DATA_DIR, file);
	if (!fs.existsSync(full)) return fallback;
	try {
		return JSON.parse(fs.readFileSync(full, "utf8")) as T;
	} catch {
		console.warn(`Could not parse ${file}; treating as missing.`);
		return fallback;
	}
}

function write(file: string, data: unknown) {
	const full = path.join(DATA_DIR, file);
	// Indented: these are committed, so a one-line 3 MB file makes both the diff
	// and any editor that opens it unusable.
	fs.writeFileSync(full, `${JSON.stringify(data, null, "\t")}\n`);
	const kb = fs.statSync(full).size / 1024;
	console.log(
		`  ${file.padEnd(24)} ${kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`}`,
	);
}

async function fetchJson<T>(url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`${url} responded ${res.status}`);
	return (await res.json()) as T;
}

/**
 * The same filter the UI uses. Excludes hero abilities (they have a `hero`
 * field) and Street Brawl items (`item_tier === 5`), which must never appear.
 */
const isShopItem = (item: Json) =>
	!Object.hasOwn(item, "hero") &&
	Boolean(item.item_slot_type) &&
	Boolean(item.shopable) &&
	Boolean(item.item_tier) &&
	(item.item_tier as number) < 5;

function buildItemsView(items: Json[], heroes: Json[]) {
	const heroAbilityClasses = new Set(
		heroes.flatMap((hero) =>
			SLOTS.map((slot) => (hero.items as Record<string, string>)?.[slot]).filter(
				Boolean,
			),
		),
	);

	return {
		items: items.filter(isShopItem).map((item) => pick(item, SHOP_FIELDS)),
		abilities: items
			.filter((item) => heroAbilityClasses.has(item.class_name as string))
			.map((item) => pick(item, ABILITY_FIELDS)),
	};
}

/**
 * The three item groups the changes page renders, in the order it renders them.
 *
 * A removed item is NOT in items-view.json - that file is built from the *new*
 * payload, and `getItemChanges()` looks items up by name in it. Measured: 0 of
 * 31 removed names appeared there, so the card silently vanished. Its data has
 * to be carried forward here, from `prevItems`, while it is still in memory.
 */
function buildItemChanges(prevItems: Json[], items: Json[]) {
	const prevShop = prevItems.filter(isShopItem);
	const nextShop = items.filter(isShopItem);

	// First run (or an unparseable baseline) has nothing to compare against.
	// Without this every one of the ~156 items reports as added on a fresh clone.
	if (prevShop.length === 0) {
		console.log("  no usable baseline - reporting no item changes");
		return { added: [], removed: [], changed: [] };
	}

	const prevByName = new Map(prevShop.map((item) => [item.name as string, item]));
	const nextNames = new Set(nextShop.map((item) => item.name as string));

	const added: Json[] = [];
	const changed: Array<{ name: string; changes: unknown[] }> = [];

	for (const item of nextShop) {
		const previous = prevByName.get(item.name as string);
		if (!previous) {
			// Present in the new payload, so items-view.json already carries it.
			added.push({ name: item.name });
			continue;
		}
		const changes = diffItems(previous as unknown as Item, item as unknown as Item);
		if (changes.length > 0) changed.push({ name: item.name as string, changes });
	}

	const removed = prevShop
		.filter((item) => !nextNames.has(item.name as string))
		.map((item) => ({ name: item.name, snapshot: pick(item, SHOP_FIELDS) }));

	return { added, removed, changed };
}

/**
 * Per-tier upgrade diffs for every hero ability, keyed by ability name.
 *
 * Computed here because the diff needs the *previous* payload, which only
 * exists at ingest. Shipping the raw `upgrades` arrays instead would cost
 * ~462 KB in items-view.json; these diffs are 111 KB and are what the popover
 * actually renders. Unchanged abilities are included on purpose - their rows
 * come out as `equal`, so the popover shows real upgrade content rather than an
 * empty state.
 */
function buildAbilityTiers(prevItems: Json[], items: Json[], heroes: Json[]) {
	const abilityClasses = new Set(
		heroes.flatMap((hero) =>
			SLOTS.map((slot) => (hero.items as Record<string, string>)?.[slot]).filter(
				Boolean,
			),
		),
	);
	const prevByName = new Map(prevItems.map((item) => [item.name as string, item]));
	const out: Record<string, TierDiff[]> = {};

	for (const item of items) {
		if (!abilityClasses.has(item.class_name as string)) continue;
		const name = item.name as string;
		const previous = prevByName.get(name);
		out[name] = diffAbilityTiers(
			(previous ?? item) as unknown as Item,
			item as unknown as Item,
		);
	}
	return out;
}

type RawPatch = {
	source: string;
	title: string;
	pub_date: string;
	link: string;
	content: string;
};

const toNote = (patch: RawPatch | undefined) =>
	patch && {
		title: patch.title.trim(),
		pubDate: patch.pub_date,
		link: patch.link,
		source: patch.source,
		html: sanitizeNotesHtml(patch.content),
	};

/**
 * Splits the feed into the two things the page needs.
 *
 * Source: Steam only. The forum entries are mirrors of the Steam posts - the
 * newest one is literally "Deadlock - Minor Update - 06-30-2026 - Steam News"
 * plus a link-unfurl card, 447 chars of noise. Preferring Steam replaces the old
 * ">40 chars of prose" heuristic, which was arbitrary and let that stub through.
 *
 * `balance` is the note describing the item/hero diff, joined by the date its
 * title embeds - the feed carries no build number. `general` is the most recent
 * note with content that is not item/hero changes, which can be a *newer,
 * different* update: a rework like "Matchmaking Update" touches no items at all,
 * while a pure balance patch has no general content. Both are surfaced so the
 * page can always show both blocks, ordered by their own dates.
 */
function pickNotes(
	patches: RawPatch[],
	versionDatetime: string,
	knownNames: Set<string>,
) {
	const steam = patches
		.filter(
			(patch) =>
				patch.source === "steam" && !Number.isNaN(Date.parse(patch.pub_date)),
		)
		.sort((a, b) => Date.parse(b.pub_date) - Date.parse(a.pub_date));

	const buildDate = versionDatetime.slice(0, 10);
	const balance =
		steam.find((patch) => titleDate(patch.title) === buildDate) ?? steam[0];

	const general = steam.find((patch) =>
		hasGeneralContent(patch.content, knownNames),
	);

	return {
		general: general && {
			title: general.title.trim(),
			pubDate: general.pub_date,
			link: general.link,
			source: general.source,
			html: sanitizeNotesHtml(generalHtml(general.content, knownNames)),
		},
		balance: balance && {
			title: balance.title.trim(),
			pubDate: balance.pub_date,
			link: balance.link,
		},
		recent: steam.slice(0, 5).map(toNote),
	};
}

/**
 * Finding #2: a hero is changed if its own object changed OR if it owns a
 * changed ability - ability diffs live in the item diff, not the hero diff.
 * Finding #5: a hero whose slots do not resolve (currently Fathom) is skipped.
 */
function countChangedHeroes(
	heroes: Json[],
	items: Json[],
	itemDiff: PrunedNode,
	heroDiff: PrunedNode,
) {
	const byClass = new Map(items.map((i) => [i.class_name as string, i]));
	let count = 0;
	for (const hero of heroes) {
		// Same guard as getChangedHeroes(), or the nav badge disagrees with the
		// number of cards actually rendered.
		if (!isLiveHero(hero)) continue;
		const slotClasses = ABILITY_SLOTS.map(
			(slot) => (hero.items as Record<string, string>)?.[slot],
		).filter(Boolean);
		const resolved = slotClasses.map((cn) => byClass.get(cn));
		if (resolved.length === 0 || resolved.some((a) => !a)) continue;

		const abilityChanged = resolved.some((ability) => {
			const node = itemDiff.modified[ability?.name as string];
			return node ? summarize(node as PrunedNode).length > 0 : false;
		});
		const weaponClass = (hero.items as Record<string, string>)?.[
			WEAPON_SLOT
		];
		const weaponNode = weaponClass ? itemDiff.modified[weaponClass] : undefined;
		const weaponChanged = weaponNode
			? summarize(weaponNode as PrunedNode).length > 0
			: false;
		const statChanges: Change[] = summarize(
			heroDiff.modified[hero.name as string] as PrunedNode,
		);
		if (abilityChanged || weaponChanged || statChanges.length > 0) count += 1;
	}
	return count;
}

async function ingest() {
	if (!fs.existsSync(DATA_DIR)) {
		fs.mkdirSync(DATA_DIR, { recursive: true });
		console.log(`Created missing directory: ${DATA_DIR}`);
	}

	// The committed copy IS the previous patch, right up until we overwrite it.
	// Missing on a first run -> [], so everything reports as added.
	const prevItems = readJsonOr<Json[]>("latest-patch.json", []);
	const prevHeroes = readJsonOr<Json[]>("latest-heroes.json", []);

	console.log("Fetching latest assets (no client_version = latest)...");
	const [steam, items, heroes, patches] = await Promise.all([
		fetchJson<{ client_version: number; version_datetime: string }>(
			`${API}/v1/assets/steam-info`,
		),
		fetchJson<Json[]>(`${API}/v1/assets/items`),
		fetchJson<Json[]>(`${API}/v1/assets/heroes`),
		fetchJson<RawPatch[]>(`${API}/v2/patches`),
	]);
	console.log(
		`  build ${steam.client_version} (${steam.version_datetime}), ` +
			`${items.length} items, ${heroes.length} heroes, ${patches.length} notes`,
	);

	// Diff on FULL payloads - trimming here loses changes.
	console.log("Diffing against committed snapshots...");
	const itemDiff = pruneUnmodified(generateDeadlockPatchDiff(prevItems, items));
	const heroDiff = pruneUnmodified(
		generateDeadlockPatchDiff(prevHeroes, heroes),
	);

	// An empty diff normally means "nothing to do". It must not mean that when an
	// artifact is missing, though - otherwise a newly added artifact (or a
	// deleted file) can never be regenerated until the next real patch lands.
	const missing = ARTIFACTS.filter(
		(file) => !fs.existsSync(path.join(DATA_DIR, file)),
	);
	if (!hasAnyChange(itemDiff) && !hasAnyChange(heroDiff) && missing.length === 0) {
		console.log("No asset changes since last ingest. Exiting.");
		return;
	}
	if (missing.length > 0) {
		console.log(`Regenerating missing artifacts: ${missing.join(", ")}`);
	}

	// Display-level changes for items: derived from the tooltip projection, not
	// from the raw diff above, which is retained for patch detection and heroes.
	const itemChanges = buildItemChanges(prevItems, items);
	console.log(
		`  items: ${itemChanges.added.length} added, ${itemChanges.removed.length} removed, ` +
			`${itemChanges.changed.length} changed`,
	);

	console.log("Writing artifacts:");
	write("item-changes.json", itemChanges);
	write("ability-tiers.json", buildAbilityTiers(prevItems, items, heroes));
	write("latest-patch.json", items);
	write("latest-heroes.json", heroes);
	write("latest-diff.json", itemDiff);
	write("latest-hero-diff.json", heroDiff);
	write("items-view.json", buildItemsView(items, heroes));
	write(
		"heroes-view.json",
		heroes.map((hero) => pick(hero, HERO_VIEW_FIELDS)),
	);
	// Hero and shop-item names, used to strip balance lines out of an unheaded
	// note. Both payloads are already in memory, so this costs nothing.
	const knownNames = new Set(
		[
			...heroes.map((hero) => hero.name),
			...items.filter(isShopItem).map((item) => item.name),
		].filter(Boolean) as string[],
	);
	write(
		"patch-notes.json",
		pickNotes(patches, steam.version_datetime, knownNames),
	);
	write("patch-meta.json", {
		clientVersion: steam.client_version,
		versionDatetime: steam.version_datetime,
		ingestedAt: new Date().toISOString(),
		counts: {
			// The badge counts what the page shows, so it counts all three groups.
			items:
				itemChanges.added.length +
				itemChanges.removed.length +
				itemChanges.changed.length,
			heroes: countChangedHeroes(heroes, items, itemDiff, heroDiff),
		},
	});

	console.log("Done.");
}

ingest().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
