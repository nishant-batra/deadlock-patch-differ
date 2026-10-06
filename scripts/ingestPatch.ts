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
	generateDeadlockPatchDiff,
	hasAnyChange,
	pruneUnmodified,
} from "../app/lib/diffEngine";
import { buildHeroChanges } from "../app/lib/heroChanges";
import { sanitizeNotesHtml } from "../app/lib/sanitizeHtml";
import {
	generalHtml,
	hasGeneralContent,
	noteForBuild,
} from "../app/lib/noteSections";
import { diffItems } from "../app/lib/tooltipProjection";
import { diffAbilityTiersByClass } from "../app/lib/abilityUpgrades";
import { mergeHotfix, toHotfixChanges } from "../app/lib/hotfix";
import { patchNotification } from "../app/lib/patchNotification";
import { isNewPatch } from "../app/lib/patchWindow";
import { ABILITY_SLOTS, WEAPON_SLOT } from "../app/lib/roster";
import type {
	Hero,
	Hotfix,
	Item,
	PatchMeta,
	PatchWindow,
	StoredItemChanges,
} from "../app/types";

const API = "https://api.deadlock-api.com";
const DATA_DIR = path.join(process.cwd(), "app", "data");

// `weapon_melee` and the `ability_*` movement slots are shared across heroes
// and never patch-notable, so they are excluded from `SLOTS`. `SLOTS` (the
// union of `WEAPON_SLOT` and `ABILITY_SLOTS`) feeds `buildItemsView` /
// `buildAbilityTiers`, which only need "every class a hero card could
// reference".
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
	"upgrades",
	// Only `weapon_primary` entries carry this - the hero page's gun stats.
	"weapon_info",
];

const TIER_DESCRIPTION_FIELDS = ["t1_desc", "t2_desc", "t3_desc"];

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
	// Upcoming heroes: `development_state` identifies them, `tags` is the one
	// piece of real copy they ship with.
	"development_state",
	"tags",
	// The hero page's header chips and spirit-scaling section.
	"gun_tag",
	"complexity",
	"scaling_stats",
];

/** Every file `ingest()` writes. Used to detect a missing artifact. */
const ARTIFACTS = [
	"item-changes.json",
	"ability-tiers.json",
	"latest-patch.json",
	"latest-heroes.json",
	"hero-changes.json",
	"hotfix.json",
	"items-view.json",
	"heroes-view.json",
	"hero-descriptions.json",
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
			.map((item) => ({
				...pick(item, ABILITY_FIELDS),
				// Only the tier texts: `desc` repeats the first tooltip section.
				description: pick(
					(item.description as Json) ?? {},
					TIER_DESCRIPTION_FIELDS,
				),
			})),
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
	return diffAbilityTiersByClass(
		prevItems as unknown as Item[],
		items as unknown as Item[],
		abilityClasses,
	);
}

type RawPatch = {
	source: string;
	title: string;
	pub_date: string;
	link: string;
	content: string;
};

const toNote = (patch: RawPatch | undefined) => {
	if (!patch) return undefined;
	const { title, pub_date, link, source, content } = patch;
	return {
		title: title.trim(),
		pubDate: pub_date,
		link,
		source,
		html: sanitizeNotesHtml(content),
	};
};

/** A note's content that is not item/hero changes, if it has any. */
const generalOf = (patch: RawPatch | undefined, knownNames: Set<string>) =>
	patch && hasGeneralContent(patch.content, knownNames)
		? {
				title: patch.title.trim(),
				pubDate: patch.pub_date,
				link: patch.link,
				source: patch.source,
				html: sanitizeNotesHtml(generalHtml(patch.content, knownNames)),
			}
		: undefined;

/**
 * Splits the feed into the two things the page needs.
 *
 * Source: Steam only. The forum entries are mirrors of the Steam posts - the
 * newest one is literally "Deadlock - Minor Update - 06-30-2026 - Steam News"
 * plus a link-unfurl card, 447 chars of noise. Preferring Steam replaces the old
 * ">40 chars of prose" heuristic, which was arbitrary and let that stub through.
 *
 * `balance` is the note describing the build at `versionDatetime` - see
 * `noteForBuild`, the feed carries no build number. `general` is the most recent
 * note with content that is not item/hero changes, which can be a *newer,
 * different* update: a rework like "Matchmaking Update" touches no items at all,
 * while a pure balance patch has no general content. The hotfix's general note
 * (`skip`) is shown with the hotfix, so it is passed over here.
 */
function pickNotes(
	patches: RawPatch[],
	versionDatetime: string,
	knownNames: Set<string>,
	skip = new Set<string>(),
) {
	const steam = patches
		.filter(
			({ source, pub_date }) =>
				source === "steam" && !Number.isNaN(Date.parse(pub_date)),
		)
		.sort(
			({ pub_date: a }, { pub_date: b }) => Date.parse(b) - Date.parse(a),
		);

	const balance = noteForBuild(
		steam.map((patch) => ({ ...patch, pubDate: patch.pub_date })),
		versionDatetime,
	);

	const general = steam.find(
		({ link, content }) =>
			!skip.has(link) && hasGeneralContent(content, knownNames),
	);

	return {
		general: generalOf(general, knownNames),
		balance: balance && {
			title: balance.title.trim(),
			pubDate: balance.pub_date,
			link: balance.link,
		},
		recent: steam.slice(0, 5).map(toNote),
	};
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
	const [{ client_version, version_datetime }, items, heroes, patches] =
		await Promise.all([
		fetchJson<{ client_version: number; version_datetime: string }>(
			`${API}/v1/assets/steam-info`,
		),
		fetchJson<Json[]>(`${API}/v1/assets/items`),
		fetchJson<Json[]>(`${API}/v1/assets/heroes`),
		fetchJson<RawPatch[]>(`${API}/v2/patches`),
	]);
	console.log(
		`  build ${client_version} (${version_datetime}), ` +
			`${items.length} items, ${heroes.length} heroes, ${patches.length} notes`,
	);

	// Only answers "did anything move at all" - what the page shows is derived
	// from value-level projections below. Diff on FULL payloads: trimming first
	// was measured to lose changes.
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

	// What this build changed since the last one. Display-level changes for
	// items come from the tooltip projection, not the raw diff above, which is
	// retained for patch detection only.
	const buildItems = buildItemChanges(
		prevItems,
		items,
	) as unknown as StoredItemChanges;
	const buildTiers = buildAbilityTiers(prevItems, items, heroes);
	const buildHeroes = buildHeroChanges(
		prevHeroes as unknown as Hero[],
		heroes as unknown as Hero[],
		prevItems as unknown as Item[],
		items as unknown as Item[],
		buildTiers,
	);
	const hasVisibleChanges =
		buildItems.added.length +
			buildItems.removed.length +
			buildItems.changed.length >
			0 || Object.keys(buildHeroes).length > 0;

	// A build within 6 days of the patch is one of its hotfixes: it goes into
	// hotfix.json and leaves the patch's diff as it is. A build with nothing a
	// player would see changes neither. Metas written before windows existed:
	// the build on the page opened one.
	const prevMeta = readJsonOr<PatchMeta | null>("patch-meta.json", null);
	const currentWindow: PatchWindow | undefined = prevMeta
		? (prevMeta.window ?? {
				startBuild: prevMeta.clientVersion,
				startedAt: prevMeta.versionDatetime,
			})
		: undefined;
	const newPatch = hasVisibleChanges && isNewPatch(currentWindow, version_datetime);
	const patchWindow: PatchWindow =
		newPatch || !currentWindow
			? { startBuild: client_version, startedAt: version_datetime }
			: currentWindow;
	const hotfixTo =
		hasVisibleChanges && !newPatch ? patchWindow.startBuild : undefined;
	console.log(
		`  build ${client_version}: ` +
			(newPatch
				? "new patch"
				: hotfixTo
					? `hotfix to ${hotfixTo}`
					: "nothing visible changed"),
	);

	// Hero and shop-item names, used to strip balance lines out of an unheaded
	// note. Both payloads are already in memory, so this costs nothing.
	const knownNames = new Set(
		[
			...heroes.map((hero) => hero.name),
			...items.filter(isShopItem).map((item) => item.name),
		].filter(Boolean) as string[],
	);
	const buildNote = pickNotes(patches, version_datetime, knownNames).balance;
	const buildGeneral = generalOf(
		patches.find(({ link }) => link === buildNote?.link),
		knownNames,
	);

	let hotfix = readJsonOr<Hotfix | null>("hotfix.json", null);
	if (newPatch) {
		hotfix = null;
	} else if (hotfixTo) {
		const itemByClass = new Map(
			(items as unknown as Item[]).map((item) => [item.class_name, item]),
		);
		const abilityNamesOf = new Map(
			(heroes as unknown as Hero[]).map(({ name, items: slots }) => [
				name,
				ABILITY_SLOTS.flatMap((slot) => {
					const ability = itemByClass.get(slots?.[slot]);
					return ability ? [ability.name] : [];
				}),
			]),
		);
		hotfix = {
			builds: [
				...(hotfix?.builds.filter((build) => build !== client_version) ?? []),
				client_version,
			],
			builtAt: version_datetime,
			note: buildNote,
			// A hotfix note with nothing but balance lines keeps the last one's.
			general: buildGeneral ?? hotfix?.general,
			...mergeHotfix(
				hotfix ?? undefined,
				toHotfixChanges(buildItems, buildHeroes, buildTiers, abilityNamesOf),
			),
		};
	}
	console.log(
		hotfix
			? `  hotfix ${hotfix.builds.join(", ")}: ${Object.keys(hotfix.after).length} changed values`
			: "  no hotfix",
	);

	console.log("Writing artifacts:");
	if (newPatch) {
		const { added, removed, changed } = buildItems;
		console.log(
			`  items: ${added.length} added, ${removed.length} removed, ` +
				`${changed.length} changed`,
		);
		console.log(`  heroes: ${Object.keys(buildHeroes).length} changed`);
		write("item-changes.json", buildItems);
		write("ability-tiers.json", buildTiers);
		write("hero-changes.json", buildHeroes);
	} else {
		// Only a new patch writes these; a missing one is rebuilt empty so the
		// page still loads.
		const empty = {
			"item-changes.json": { added: [], removed: [], changed: [] },
			"ability-tiers.json": {},
			"hero-changes.json": {},
		};
		for (const [file, data] of Object.entries(empty)) {
			if (missing.includes(file)) write(file, data);
		}
	}
	write("hotfix.json", hotfix);
	write("latest-patch.json", items);
	write("latest-heroes.json", heroes);
	write("items-view.json", buildItemsView(items, heroes));
	write(
		"heroes-view.json",
		heroes.map((hero) => pick(hero, HERO_VIEW_FIELDS)),
	);
	// Its own file rather than a heroes-view field: only the hero page reads
	// it, and the lore would otherwise ride along on every roster payload.
	write(
		"hero-descriptions.json",
		Object.fromEntries(
			heroes
				.filter((hero) => hero.description)
				.map((hero) => [hero.class_name, hero.description]),
		),
	);
	// The balance note is the patch's, not its latest hotfix's, and the
	// hotfix's general note stays with the hotfix.
	write(
		"patch-notes.json",
		pickNotes(
			patches,
			patchWindow.startedAt,
			knownNames,
			new Set(hotfix?.general ? [hotfix.general.link] : []),
		),
	);
	write("patch-meta.json", {
		clientVersion: client_version,
		versionDatetime: version_datetime,
		ingestedAt: new Date().toISOString(),
		window: patchWindow,
	});

	// Every new build gets a GitHub issue - the workflow opens it after the data
	// is pushed. A re-published build (same number) is not news.
	if (prevMeta?.clientVersion !== client_version) {
		const names = (list: Array<{ name: string }>) =>
			list.map(({ name }) => name);
		notify(
			patchNotification({
				build: client_version,
				buildTime: version_datetime,
				hotfixTo,
				// This build's own changes, not the merged hotfixes.
				items: {
					added: names(buildItems.added),
					removed: names(buildItems.removed),
					changed: names(buildItems.changed),
				},
				heroes: Object.keys(buildHeroes),
				note: buildNote,
			}),
		);
	}

	console.log("Done.");
}

/**
 * Hands the issue to the workflow: the body as a file, and `notify=true` plus
 * the title as step outputs. Outside GitHub Actions it only logs.
 */
function notify({ title, body }: { title: string; body: string }) {
	const { GITHUB_OUTPUT, RUNNER_TEMP } = process.env;
	console.log(`Notification: ${title}`);
	if (!GITHUB_OUTPUT || !RUNNER_TEMP) return;
	const bodyFile = path.join(RUNNER_TEMP, "patch-notification.md");
	fs.writeFileSync(bodyFile, body);
	fs.appendFileSync(
		GITHUB_OUTPUT,
		`notify=true\ntitle=${title}\nbody_file=${bodyFile}\n`,
	);
}

ingest().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
