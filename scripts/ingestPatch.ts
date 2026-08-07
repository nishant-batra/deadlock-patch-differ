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
import { hasProse, sanitizeNotesHtml } from "../app/utils/sanitizeHtml";
import { diffItems } from "../app/utils/tooltipProjection";
import type { Item } from "../app/types";

const API = "https://api.deadlock-api.com";
const DATA_DIR = path.join(process.cwd(), "app", "data");

// Hero ability slots that a hero card renders. `weapon_melee` and the
// `ability_*` movement slots are shared across heroes and never patch-notable.
const SLOTS = [
	"weapon_primary",
	"signature1",
	"signature2",
	"signature3",
	"signature4",
];

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

const ABILITY_STUB_FIELDS = [
	"id",
	"class_name",
	"name",
	"image_webp",
	"image",
	"hero",
	"ability_type",
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

/**
 * 3.59 MB -> ~1.65 MB: full detail only for abilities that actually changed,
 * icon-only stubs for the rest.
 */
function buildItemsView(items: Json[], heroes: Json[], itemDiff: PrunedNode) {
	const heroAbilityClasses = new Set(
		heroes.flatMap((hero) =>
			SLOTS.map((slot) => (hero.items as Record<string, string>)?.[slot]).filter(
				Boolean,
			),
		),
	);
	const changedNames = new Set([
		...Object.keys(itemDiff.modified),
		...Object.keys(itemDiff.added),
	]);

	return {
		items: items.filter(isShopItem).map((item) => pick(item, SHOP_FIELDS)),
		abilities: items
			.filter((item) => heroAbilityClasses.has(item.class_name as string))
			.map((item) =>
				pick(
					item,
					changedNames.has(item.name as string)
						? ABILITY_FIELDS
						: ABILITY_STUB_FIELDS,
				),
			),
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

/** Notes trail their build, so the match window extends both ways. */
const NOTE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * No source is trusted to carry prose, and notes do not line up 1:1 with builds.
 *
 * The original rule was `pub_date <= versionDatetime`, which is backwards for
 * the case that matters most: Valve ships the build, then posts the notes hours
 * later. Build 6644 is stamped 15:39:35 while its notes went up at 20:24:35Z, so
 * the newest patch's own notes were always excluded and the site fell back to a
 * three-week-old entry.
 *
 * Nearest-in-time within the window, rather than longest or newest. Longest
 * picks the previous patch's bigger changelog; newest picks the forum
 * link-unfurl stub that went up 4 minutes after the real Steam post. Verified
 * against six historical builds.
 */
function pickNotes(patches: RawPatch[], versionDatetime: string) {
	const buildTime = Date.parse(`${versionDatetime}Z`);
	const withProse = patches.filter(
		(patch) =>
			!Number.isNaN(Date.parse(patch.pub_date)) && hasProse(patch.content),
	);
	const distance = (patch: RawPatch) =>
		Math.abs(Date.parse(patch.pub_date) - buildTime);

	const near = Number.isNaN(buildTime)
		? []
		: withProse
				.filter((patch) => distance(patch) <= NOTE_WINDOW_MS)
				.sort((a, b) => distance(a) - distance(b));

	// A build with no notes of its own (6640 was one) keeps the previous entry
	// rather than showing nothing.
	const byRecency = withProse
		.filter(
			(patch) =>
				Number.isNaN(buildTime) || Date.parse(patch.pub_date) <= buildTime,
		)
		.sort((a, b) => Date.parse(b.pub_date) - Date.parse(a.pub_date));

	const primary = near[0] ?? byRecency[0];
	const rest = [...withProse]
		.sort((a, b) => Date.parse(b.pub_date) - Date.parse(a.pub_date))
		.filter((patch) => patch !== primary);

	return {
		primary: toNote(primary),
		recent: [primary, ...rest].filter(Boolean).slice(0, 5).map(toNote),
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
		const slotClasses = SLOTS.map(
			(slot) => (hero.items as Record<string, string>)?.[slot],
		).filter(Boolean);
		const resolved = slotClasses.map((cn) => byClass.get(cn));
		if (resolved.length === 0 || resolved.some((a) => !a)) continue;

		const abilityChanged = resolved.some((ability) => {
			const node = itemDiff.modified[ability?.name as string];
			return node ? summarize(node as PrunedNode).length > 0 : false;
		});
		const statChanges: Change[] = summarize(
			heroDiff.modified[hero.name as string] as PrunedNode,
		);
		if (abilityChanged || statChanges.length > 0) count += 1;
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
	write("latest-patch.json", items);
	write("latest-heroes.json", heroes);
	write("latest-diff.json", itemDiff);
	write("latest-hero-diff.json", heroDiff);
	write("items-view.json", buildItemsView(items, heroes, itemDiff));
	write(
		"heroes-view.json",
		heroes.map((hero) => pick(hero, HERO_VIEW_FIELDS)),
	);
	write("patch-notes.json", pickNotes(patches, steam.version_datetime));
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
