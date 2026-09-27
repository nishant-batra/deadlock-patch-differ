// app/pages/patch-notes/server.ts
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import abilityTiersJson from "#/data/ability-tiers.json";
import heroesViewJson from "#/data/heroes-view.json";
import itemChangesJson from "#/data/item-changes.json";
import latestHeroDiffJson from "#/data/latest-hero-diff.json";
import patchNotesJson from "#/data/patch-notes.json";
import type { TierDiff } from "#/lib/abilityUpgrades";
import { type PrunedNode, summarize } from "#/lib/diffEngine";
import { isHeroChanged, isLiveHero, WEAPON_SLOT } from "#/lib/roster";
import {
	itemChangesByName,
	joinAbilities,
	readItemDiff,
	readItemsView,
} from "#/server/core";
import type { ChangedHero, Hero, Item, ItemChanges, PatchNotes } from "#/types";

export function getPatchNotes(): PatchNotes {
	return patchNotesJson as unknown as PatchNotes;
}

type RawItemChanges = {
	added: Array<{ name: string }>;
	removed: Array<{ name: string; snapshot: Item }>;
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
	const raw = itemChangesJson as unknown as RawItemChanges;

	return {
		added: raw.added.flatMap((entry) => {
			const item = byName.get(entry.name);
			return item ? [item] : [];
		}),
		removed: raw.removed.map((entry) => entry.snapshot),
		changed: [...itemChangesByName()].flatMap(([name, changes]) => {
			const item = byName.get(name);
			return item ? [{ item, changes }] : [];
		}),
	};
}

/**
 * A hero with an unresolvable ability slot (currently Fathom, which is
 * unreleased) is dropped entirely rather than rendered half-empty. A missing
 * weapon slot does not drop the hero - it just yields no weapon changes.
 * Whether a resolved hero counts as "changed" is decided by `isHeroChanged()`.
 */
export function getChangedHeroes(): ChangedHero[] {
	const heroes = heroesViewJson as unknown as Hero[];
	const { abilities } = readItemsView();
	const heroDiff = latestHeroDiffJson as unknown as PrunedNode;
	const itemDiff = readItemDiff();
	const abilityByClass = new Map(abilities.map((a) => [a.class_name, a]));

	const tiersByName = abilityTiersJson as unknown as Record<string, TierDiff[]>;

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

export type ChangesPayload = {
	items: ItemChanges;
	heroes: ChangedHero[];
	notes: PatchNotes;
};

// Return type is explicit: without it the server-fn boundary widens the loader
// data to `any` and every downstream callback loses its types.
export const fetchChanges = createServerFn({ method: "GET" }).handler(
	async (): Promise<ChangesPayload> => {
		// Rebuilt by the deploy hook whenever new artifacts are committed.
		setResponseHeader("Cache-Control", "public, s-maxage=31536000, immutable");
		return {
			items: getItemChanges(),
			heroes: getChangedHeroes(),
			notes: getPatchNotes(),
		};
	},
);
