// app/server/heroes.ts
//
// Shared by `/heroes`, `/heroes/$heroSlug`, `/compare` and the Changes page -
// all of them render the same roster, and separate definitions would let them
// drift.
import { createServerFn } from "@tanstack/react-start";
import abilityTiersJson from "#/data/ability-tiers.json";
import heroDescriptionsJson from "#/data/hero-descriptions.json";
import heroesViewJson from "#/data/heroes-view.json";
import { currentTiers, type TierDiff } from "#/lib/abilityUpgrades";
import { isLiveHero, isUpcomingHero, WEAPON_SLOT } from "#/lib/roster";
import { heroSlug } from "#/shared/utils/heroSlug";
import type {
	CompareHero,
	Hero,
	HeroDescription,
	HeroEntry,
	HeroPage,
	HeroWeapon,
	Item,
} from "#/types";
import { joinAbilities, readItemsView } from "./core";

/** No ability changes - the roster pages show each kit as it stands. */
const NO_CHANGES = {};

const readHeroes = () => heroesViewJson as unknown as Hero[];

/**
 * The catalog is a static import, so these lookups are built once per server
 * instance on first use, not on every request.
 */
let abilityByClassCache: Map<string, Item> | undefined;
const abilityByClass = () => {
	abilityByClassCache ??= new Map(
		readItemsView().abilities.map((ability) => [ability.class_name, ability]),
	);
	return abilityByClassCache;
};

let heroBySlugCache: Map<string, Hero> | undefined;
const heroBySlug = () => {
	heroBySlugCache ??= new Map(
		readHeroes().map((hero) => [heroSlug(hero.name), hero]),
	);
	return heroBySlugCache;
};

/**
 * A live hero joined to its current kit, or `undefined` when an ability slot
 * does not resolve. Joined with `NO_CHANGES` so abilities render their real
 * (possibly unchanged) tiers with no diff noise.
 */
function liveEntry(hero: Hero): HeroEntry | undefined {
	const abilities = joinAbilities(
		hero,
		abilityByClass(),
		abilityTiersJson as unknown as Record<string, TierDiff[]>,
		NO_CHANGES,
	);
	if (!abilities) return undefined;
	return {
		hero,
		abilities: abilities.map(({ tiers, ...ability }) => ({
			...ability,
			tiers: currentTiers(tiers),
		})),
	};
}

/** Every live hero, unfiltered by whether anything changed. */
export function getAllHeroes(): HeroEntry[] {
	return readHeroes().flatMap((hero) => {
		if (!isLiveHero(hero)) return [];
		const entry = liveEntry(hero);
		return entry ? [entry] : [];
	});
}

/** Announced heroes that are not playable yet, alphabetical. */
export function getUpcomingHeroes(): Hero[] {
	return readHeroes()
		.filter(isUpcomingHero)
		.sort(({ name: a }, { name: b }) => a.localeCompare(b));
}

/**
 * The hero's gun, trimmed to its name and stats - the catalog entry also
 * carries a full property bag the page never reads.
 */
function heroWeapon({ items }: Hero): HeroWeapon | undefined {
	const weapon = abilityByClass().get(items?.[WEAPON_SLOT]);
	if (!weapon?.weapon_info) return undefined;
	const { name, weapon_info } = weapon;
	return { name, weapon_info };
}

/**
 * The hero at `/heroes/$heroSlug`. One Map lookup and one ability join,
 * instead of building the whole roster to find a single hero. The gun and
 * description are attached here only - the roster pages never show them.
 */
export function getHeroPage(slug: string): HeroPage | undefined {
	const hero = heroBySlug().get(slug);
	if (!hero) return undefined;
	if (isLiveHero(hero)) {
		const entry = liveEntry(hero);
		if (!entry) return undefined;
		const descriptions = heroDescriptionsJson as Record<
			string,
			HeroDescription
		>;
		return {
			kind: "live",
			entry,
			weapon: heroWeapon(hero),
			description: descriptions[hero.class_name],
		};
	}
	return isUpcomingHero(hero) ? { kind: "upcoming", hero } : undefined;
}

/**
 * The return type is explicit for the same reason as the routes: without it
 * the server-fn boundary widens the loader data to `any` and every downstream
 * callback loses its types.
 */
export const fetchHeroes = createServerFn({ method: "GET" }).handler(
	async (): Promise<HeroEntry[]> => getAllHeroes(),
);

export const fetchUpcomingHeroes = createServerFn({ method: "GET" }).handler(
	async (): Promise<Hero[]> => getUpcomingHeroes(),
);

export const fetchHeroPage = createServerFn({ method: "GET" })
	.inputValidator((slug: string) => slug)
	.handler(
		async ({ data }): Promise<HeroPage | null> => getHeroPage(data) ?? null,
	);

/**
 * `/compare` reads stats and the gun, never the ability kit - so it gets the
 * hero plus its weapon instead of the full `HeroEntry` roster.
 */
export const fetchCompareHeroes = createServerFn({ method: "GET" }).handler(
	async (): Promise<CompareHero[]> =>
		readHeroes()
			.filter(isLiveHero)
			.map((hero) => ({ hero, weapon: heroWeapon(hero) })),
);
