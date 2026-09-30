// app/pages/patch-notes/server.ts
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import abilityTiersJson from "#/data/ability-tiers.json";
import heroesViewJson from "#/data/heroes-view.json";
import itemChangesJson from "#/data/item-changes.json";
import patchNotesJson from "#/data/patch-notes.json";
import type { TierDiff } from "#/lib/abilityUpgrades";
import { isLiveHero } from "#/lib/roster";
import {
	itemChangesByName,
	joinAbilities,
	readHeroChanges,
	readItemsView,
} from "#/server/core";
import { getUpcomingHeroes } from "#/server/heroes";
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
	const { added, removed } = itemChangesJson as unknown as RawItemChanges;

	return {
		added: added.flatMap(({ name }) => {
			const item = byName.get(name);
			return item ? [item] : [];
		}),
		removed: removed.map(({ snapshot }) => snapshot),
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
 * Whether a hero counts as "changed" was decided at ingest: it is changed iff
 * it has a hero-changes.json entry (see lib/heroChanges.ts).
 */
export function getChangedHeroes(): ChangedHero[] {
	const heroes = heroesViewJson as unknown as Hero[];
	const { abilities } = readItemsView();
	const abilityByClass = new Map(abilities.map((a) => [a.class_name, a]));
	const heroChanges = readHeroChanges();

	const tiersByName = abilityTiersJson as unknown as Record<string, TierDiff[]>;

	return heroes.flatMap((hero) => {
		const changes = heroChanges[hero.name];
		// Unreleased and experimental heroes ship in the catalog but are not in
		// play - Raven was rendering as a changed hero.
		if (!changes || !isLiveHero(hero)) return [];
		const { abilities: abilityDiffs, stats, weapon } = changes;

		const abilityChanges = joinAbilities(
			hero,
			abilityByClass,
			tiersByName,
			abilityDiffs,
		);
		if (!abilityChanges) return [];

		return [
			{
				hero,
				abilities: abilityChanges,
				statChanges: stats,
				weaponChanges: weapon,
			},
		];
	});
}

export type ChangesPayload = {
	items: ItemChanges;
	heroes: ChangedHero[];
	/** Announced, not yet playable - the "New heroes" block. */
	upcomingHeroes: Hero[];
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
			upcomingHeroes: getUpcomingHeroes(),
			notes: getPatchNotes(),
		};
	},
);
