// app/server/heroes.ts
//
// Shared by `/heroes`, `/heroes/$heroSlug`, and `/compare` - all three render
// the same live roster, and separate definitions would let them drift.
import { createServerFn } from "@tanstack/react-start";
import abilityTiersJson from "#/data/ability-tiers.json";
import heroesViewJson from "#/data/heroes-view.json";
import { currentTiers, type TierDiff } from "#/lib/abilityUpgrades";
import { isLiveHero } from "#/lib/roster";
import type { Hero, HeroEntry } from "#/types";
import {
	changedHeroNames,
	EMPTY_DIFF,
	joinAbilities,
	readItemsView,
} from "./core";

/**
 * Every live hero, unfiltered by whether anything changed - the "All heroes"
 * page. Joined with `EMPTY_DIFF` so abilities render their real (possibly
 * unchanged) tiers with no diff noise.
 */
export function getAllHeroes(): HeroEntry[] {
	const heroes = heroesViewJson as unknown as Hero[];
	const { abilities } = readItemsView();
	const abilityByClass = new Map(abilities.map((a) => [a.class_name, a]));
	const tiersByName = abilityTiersJson as unknown as Record<string, TierDiff[]>;

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

/**
 * The return type is explicit for the same reason as the routes: without it
 * the server-fn boundary widens the loader data to `any` and every downstream
 * callback loses its types.
 */
export const fetchHeroes = createServerFn({ method: "GET" }).handler(
	async (): Promise<HeroEntry[]> => getAllHeroes(),
);

/**
 * Serialized as `string[]`, not a `Set` - server-fn results cross a network
 * boundary and a `Set` doesn't survive that round-trip intact.
 */
export const fetchChangedHeroNames = createServerFn({ method: "GET" }).handler(
	async (): Promise<string[]> => changedHeroNames(),
);
