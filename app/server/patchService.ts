// app/server/patchService.ts
//
// Reads the precomputed artifacts written by scripts/ingestPatch.ts. The only
// real logic here is joining the two sources of "this hero changed".

import fs from "node:fs";
import path from "node:path";
import type {
	AbilityChange,
	ChangedHero,
	ChangedItem,
	Hero,
	HeroEntry,
	Item,
	ItemChanges,
	ItemSlotType,
	ItemsPage,
	ItemsView,
	PatchMeta,
	PatchNotes,
} from "#/types";
import { currentTiers, type TierDiff } from "#/utils/abilityUpgrades";
import { type PrunedNode, summarize } from "#/utils/diffEngine";
import {
	ABILITY_SLOTS,
	isHeroChanged,
	isLiveHero,
	WEAPON_SLOT,
} from "#/utils/roster";

const DATA_DIR = path.join(process.cwd(), "app", "data");

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

/**
 * Filtered to one slot type server-side rather than shipping the full ~1.2 MB
 * catalog and letting the `/items` page filter client-side - `totalCount`
 * (unfiltered) is carried alongside so the page's SEO copy still reports the
 * whole catalog, not just the active tab.
 */
export function getItemsPage(slotType: ItemSlotType): ItemsPage {
	const items = readItemsView().items;
	return {
		items: items.filter((item) => item.item_slot_type === slotType),
		totalCount: items.length,
	};
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
 * Joins a hero's four signature/ultimate slots to their ability entries and
 * diffs each against `itemDiff`. Shared by `getChangedHeroes()` (real diff)
 * and `getAllHeroes()` (`EMPTY_DIFF`, so every ability comes back with
 * `changes: []` and its real three tiers - `diffAbilityTiers` keeps `equal`
 * rows on purpose so the popover still shows genuine upgrade content).
 *
 * Returns `undefined` when a slot fails to resolve (currently only Fathom,
 * unreleased) - the caller drops the hero rather than rendering it half-empty.
 */
function joinAbilities(
	hero: Hero,
	abilityByClass: Map<string, Item>,
	tiersByName: Record<string, TierDiff[]>,
	itemDiff: PrunedNode,
): AbilityChange[] | undefined {
	const slotClasses = ABILITY_SLOTS.map((slot) => hero.items?.[slot]).filter(
		Boolean,
	);
	const resolved = slotClasses.map((cn) => abilityByClass.get(cn));
	if (resolved.length === 0 || resolved.some((a) => !a)) return undefined;

	return (resolved as Item[]).map((ability) => ({
		ability,
		changes: summarize(itemDiff.modified[ability.name] as PrunedNode),
		// Always three tiers, even unchanged - the popover renders real
		// upgrade content either way.
		tiers: tiersByName[ability.name] ?? [],
	}));
}

/**
 * A hero with an unresolvable ability slot (currently Fathom, which is
 * unreleased) is dropped entirely rather than rendered half-empty. A missing
 * weapon slot does not drop the hero - it just yields no weapon changes.
 * Whether a resolved hero counts as "changed" is decided by `isHeroChanged()`.
 */
export function getChangedHeroes(): ChangedHero[] {
	const heroes = read<Hero[]>("heroes-view.json", []);
	const { abilities } = readItemsView();
	const heroDiff = read<PrunedNode>("latest-hero-diff.json", EMPTY_DIFF);
	const itemDiff = readItemDiff();
	const abilityByClass = new Map(abilities.map((a) => [a.class_name, a]));

	const tiersByName = read<Record<string, TierDiff[]>>(
		"ability-tiers.json",
		{},
	);

	return heroes.flatMap((hero) => {
		// Unreleased and experimental heroes ship in the catalog but are not in
		// play - Raven was rendering as a changed hero.
		if (!isLiveHero(hero)) return [];

		const abilityChanges = joinAbilities(
			hero,
			abilityByClass,
			tiersByName,
			itemDiff,
		);
		if (!abilityChanges) return [];

		if (!isHeroChanged(hero, abilityByClass, itemDiff, heroDiff)) return [];

		// Stat moves land in `starting_stats` OR `standard_level_up_upgrades`.
		// summarize() walks whatever moved.
		const statChanges = summarize(heroDiff.modified[hero.name] as PrunedNode);
		const weaponClass = hero.items?.[WEAPON_SLOT];
		const weaponChanges = weaponClass
			? summarize(itemDiff.modified[weaponClass] as PrunedNode)
			: [];

		return [{ hero, abilities: abilityChanges, statChanges, weaponChanges }];
	});
}

/**
 * Every live hero, unfiltered by whether anything changed - the "All heroes"
 * page. Joined with `EMPTY_DIFF` so abilities render their real (possibly
 * unchanged) tiers with no diff noise.
 */
export function getAllHeroes(): HeroEntry[] {
	const heroes = read<Hero[]>("heroes-view.json", []);
	const { abilities } = readItemsView();
	const abilityByClass = new Map(abilities.map((a) => [a.class_name, a]));
	const tiersByName = read<Record<string, TierDiff[]>>(
		"ability-tiers.json",
		{},
	);

	return heroes.flatMap((hero) => {
		if (!isLiveHero(hero)) return [];
		const abilityChanges = joinAbilities(
			hero,
			abilityByClass,
			tiersByName,
			EMPTY_DIFF,
		);
		if (!abilityChanges) return [];
		const current = abilityChanges.map((change) => ({
			...change,
			tiers: currentTiers(change.tiers),
		}));
		return [{ hero, abilities: current }];
	});
}
