// app/server/patchService.ts
//
// Reads the precomputed artifacts written by scripts/ingestPatch.ts. The only
// real logic here is joining the two sources of "this hero changed".

import fs from "node:fs";
import path from "node:path";
import type {
	ChangedHero,
	ChangedItem,
	Hero,
	Item,
	ItemChanges,
	ItemsView,
	PatchMeta,
	PatchNotes,
} from "#/types";
import { type PrunedNode, summarize } from "#/utils/diffEngine";

const DATA_DIR = path.join(process.cwd(), "app", "data");

const SLOTS = [
	"weapon_primary",
	"signature1",
	"signature2",
	"signature3",
	"signature4",
];

const EMPTY_DIFF: PrunedNode = { added: {}, removed: {}, modified: {} };

function read<T>(file: string, fallback: T): T {
	const full = path.join(DATA_DIR, file);
	if (!fs.existsSync(full)) return fallback;
	try {
		return JSON.parse(fs.readFileSync(full, "utf8")) as T;
	} catch {
		return fallback;
	}
}

const readItemsView = () =>
	read<ItemsView>("items-view.json", { items: [], abilities: [] });

const readItemDiff = () => read<PrunedNode>("latest-diff.json", EMPTY_DIFF);

export function getPatchMeta(): PatchMeta | null {
	return read<PatchMeta | null>("patch-meta.json", null);
}

export function getPatchNotes(): PatchNotes {
	return read<PatchNotes>("patch-notes.json", { recent: [] });
}

export function getAllItems(): Item[] {
	return readItemsView().items;
}

type RawItemChanges = {
	added: Array<{ name: string }>;
	removed: Array<{ name: string; snapshot: Item }>;
	changed: Array<{ name: string; changes: ChangedItem["changes"] }>;
};

const EMPTY_ITEM_CHANGES: RawItemChanges = {
	added: [],
	removed: [],
	changed: [],
};

/**
 * Shop items only - ability changes surface through `getChangedHeroes()`.
 *
 * Reads the precomputed display-level diff rather than deriving one from
 * `latest-diff.json`: the raw payload diff is ~67% fields no player can see,
 * and it flattens `tooltip_sections` into one opaque array leaf, which is where
 * prose rewrites and new stat rows actually live.
 *
 * Removed items come from the snapshot ingest carried forward - they are absent
 * from items-view.json, which is built from the new payload.
 */
export function getItemChanges(): ItemChanges {
	const { items } = readItemsView();
	const byName = new Map(items.map((item) => [item.name, item]));
	const raw = read<RawItemChanges>("item-changes.json", EMPTY_ITEM_CHANGES);

	return {
		added: raw.added.flatMap((entry) => {
			const item = byName.get(entry.name);
			return item ? [item] : [];
		}),
		removed: raw.removed.map((entry) => entry.snapshot),
		changed: raw.changed.flatMap((entry) => {
			const item = byName.get(entry.name);
			return item ? [{ item, changes: entry.changes }] : [];
		}),
	};
}

/**
 * Finding #2: a hero is changed if its own object changed OR it owns a changed
 * ability - ability diffs live in the item diff, not the hero diff.
 * Finding #5: a hero with an unresolvable ability slot (currently Fathom, which
 * is unreleased) is dropped entirely rather than rendered half-empty.
 */
export function getChangedHeroes(): ChangedHero[] {
	const heroes = read<Hero[]>("heroes-view.json", []);
	const { abilities } = readItemsView();
	const heroDiff = read<PrunedNode>("latest-hero-diff.json", EMPTY_DIFF);
	const itemDiff = readItemDiff();
	const abilityByClass = new Map(abilities.map((a) => [a.class_name, a]));

	return heroes.flatMap((hero) => {
		const slotClasses = SLOTS.map((slot) => hero.items?.[slot]).filter(Boolean);
		const resolved = slotClasses.map((cn) => abilityByClass.get(cn));
		if (resolved.length === 0 || resolved.some((a) => !a)) return [];

		const abilityChanges = (resolved as Item[]).map((ability) => ({
			ability,
			changes: summarize(itemDiff.modified[ability.name] as PrunedNode),
		}));
		// Finding #1: stat moves land in `starting_stats` OR
		// `standard_level_up_upgrades`. summarize() walks whatever moved.
		const statChanges = summarize(heroDiff.modified[hero.name] as PrunedNode);

		const changed =
			statChanges.length > 0 ||
			abilityChanges.some((a) => a.changes.length > 0);
		return changed ? [{ hero, abilities: abilityChanges, statChanges }] : [];
	});
}
