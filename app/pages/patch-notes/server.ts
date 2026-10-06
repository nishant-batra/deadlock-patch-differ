// app/pages/patch-notes/server.ts
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import abilityTiersJson from "#/data/ability-tiers.json";
import heroesViewJson from "#/data/heroes-view.json";
import hotfixJson from "#/data/hotfix.json";
import itemChangesJson from "#/data/item-changes.json";
import patchNotesJson from "#/data/patch-notes.json";
import { getPatchMeta } from "#/layout/server";
import type { TierDiff } from "#/lib/abilityUpgrades";
import { readHotfix } from "#/lib/hotfix";
import { isLiveHero } from "#/lib/roster";
import { joinAbilities, readHeroChanges, readItemsView } from "#/server/core";
import { getUpcomingHeroes } from "#/server/heroes";
import type {
	ChangedHero,
	Hero,
	HeroChanges,
	Hotfix,
	ItemChanges,
	NoteRef,
	PatchNote,
	PatchNotes,
	StoredItemChanges,
} from "#/types";

export function getPatchNotes(): PatchNotes {
	return patchNotesJson as unknown as PatchNotes;
}

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
export function getItemChanges(
	{ added, removed, changed }: StoredItemChanges = itemChangesJson as unknown as StoredItemChanges,
): ItemChanges {
	const { items } = readItemsView();
	const byName = new Map(items.map((item) => [item.name, item]));

	return {
		added: added.flatMap(({ name }) => {
			const item = byName.get(name);
			return item ? [item] : [];
		}),
		removed: removed.map(({ snapshot }) => snapshot),
		changed: changed.flatMap(({ name, changes }) => {
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
 * it has an entry in `heroChanges` (see lib/heroChanges.ts).
 */
export function getChangedHeroes(
	heroChanges: Record<string, HeroChanges> = readHeroChanges(),
	tiersByName: Record<string, TierDiff[]> = abilityTiersJson as unknown as Record<
		string,
		TierDiff[]
	>,
): ChangedHero[] {
	const heroes = heroesViewJson as unknown as Hero[];
	const { abilities } = readItemsView();
	const abilityByClass = new Map(abilities.map((a) => [a.class_name, a]));

	return heroes
		.flatMap((hero) => {
			const changes = heroChanges[hero.name];
			// Unreleased and experimental heroes ship in the catalog but are not in
			// play - Raven was rendering as a changed hero.
			if (!changes || !isLiveHero(hero)) return [];
			const { abilities: abilityDiffs, stats, weapon, isNew } = changes;

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
					...(isNew && { isNew }),
				},
			];
			// Newly released heroes lead the list; sort() is stable, so the rest
			// keep catalog order.
		})
		.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
}

export type HotfixChanges = {
	builds: number[];
	builtAt: string;
	note?: NoteRef;
	general?: PatchNote;
	items: ItemChanges;
	heroes: ChangedHero[];
};

/**
 * Every hotfix since the patch, in the same shapes as the patch. The data is a
 * static import, so it is read once per server instance.
 */
let hotfixCache: HotfixChanges | null | undefined;
export function getHotfixChanges(): HotfixChanges | null {
	if (hotfixCache !== undefined) return hotfixCache;
	const hotfix = hotfixJson as unknown as Hotfix | null;
	if (!hotfix) {
		hotfixCache = null;
		return hotfixCache;
	}
	const { builds, builtAt, note, general } = hotfix;
	const { items, heroes, tiers } = readHotfix(hotfix, readItemsView().abilities);
	hotfixCache = {
		builds,
		builtAt,
		note,
		general,
		items: getItemChanges(items),
		heroes: getChangedHeroes(heroes, tiers),
	};
	return hotfixCache;
}

export type ChangesPayload = {
	/** The patch: the build that opened the window, and when. */
	patch?: { build: number; builtAt: string };
	items: ItemChanges;
	heroes: ChangedHero[];
	/** Every hotfix since the patch, merged; shown above it. */
	hotfix: HotfixChanges | null;
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
		const meta = getPatchMeta();
		const patchWindow =
			meta &&
			(meta.window ?? {
				startBuild: meta.clientVersion,
				startedAt: meta.versionDatetime,
			});
		return {
			patch: patchWindow
				? { build: patchWindow.startBuild, builtAt: patchWindow.startedAt }
				: undefined,
			items: getItemChanges(),
			heroes: getChangedHeroes(),
			hotfix: getHotfixChanges(),
			upcomingHeroes: getUpcomingHeroes(),
			notes: getPatchNotes(),
		};
	},
);
