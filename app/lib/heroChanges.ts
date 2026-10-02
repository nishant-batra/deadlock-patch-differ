// app/lib/heroChanges.ts
//
// What a hero card shows as "changed", computed once at ingest into
// hero-changes.json. The raw payload diff is not usable for this: build 6722
// added `gender`, `search_name`, `popular_items` to every hero and moved every
// property icon URL, which flagged all 38 live heroes as changed. So instead
// of walking whatever moved, this compares an allowlist of player-facing
// values:
//
//   hero      starting_stats.*.value, standard_level_up_upgrades.*
//   weapon    every numeric weapon_info field (ranges and spread penalties
//             included), minus derived duplicates and the recoil RNG seed
//   ability   properties.*.value and properties.*.scale_function.stat_scale,
//             the tooltip text (each info section's `loc_string`), and the
//             upgrade tiers
//
// and judges each value, not its presence in the payload:
//
//   missing/0 -> missing/0          no change
//   missing   -> value              NEW, unless the API never reported that
//                                   field for anyone before (spread, zoom_fov
//                                   and ooc_health_regen all arrived on every
//                                   hero at once in 6722 - that is the API
//                                   growing, not a patch)
//   value     -> missing            REMOVED, unless no record reports that
//                                   field any more (the API dropped it)
//   value     -> other value        old -> new (0 included, so "12 -> 0" shows)

import type { Hero, HeroChanges, Item } from "#/types";
import { hasTierChanges, type TierDiff } from "./abilityUpgrades";
import type { Change } from "./diffEngine";
import { ABILITY_SLOTS, isLiveHero, WEAPON_SLOT } from "./roster";
import { isEmptyStatValue } from "./statValue";
import { prose } from "./tooltipProjection";

type StatValue = string | number;
type StatEntry = { path: string[]; value: StatValue };
/** Field id -> its value on one record. The id is also the schema key. */
type StatEntries = Map<string, StatEntry>;

/**
 * `weapon_info` fields that restate another one: `damage_per_*` derive from
 * `bullet_damage`, and `shots_per_second` equals `bullets_per_second` unless a
 * weapon fires pellets. `recoil_seed` only fixes the RNG of the recoil pattern
 * - "Recoil Seed 755 -> 9812" means nothing to a player.
 */
const SKIPPED_WEAPON_FIELDS = new Set([
	"damage_per_shot",
	"damage_per_magazine",
	"damage_per_second_with_reload",
	"shots_per_second",
	"shots_per_second_with_reload",
	"bullets_per_second_with_reload",
	"recoil_seed",
]);

const isNumberList = (value: unknown): value is number[] =>
	Array.isArray(value) && value.every((entry) => typeof entry === "number");

/** `[0, 0.75]` -> `"0 / 0.75"`: a range reads as one value on a card. */
const joinRange = (values: number[]) => values.join(" / ");

function weaponEntries(info: Item["weapon_info"] | undefined): StatEntries {
	const entries: StatEntries = new Map();
	for (const [field, raw] of Object.entries(info ?? {})) {
		if (SKIPPED_WEAPON_FIELDS.has(field)) continue;
		let value: StatValue | undefined;
		if (typeof raw === "number") value = raw;
		else if (isNumberList(raw)) value = joinRange(raw);
		// `vertical_recoil` / `horizontal_recoil`: only the kick range is a stat;
		// the `burst_*` numbers shape the curve and have no in-game readout.
		else if (
			raw &&
			typeof raw === "object" &&
			isNumberList((raw as { range?: unknown }).range)
		)
			value = joinRange((raw as { range: number[] }).range);
		if (value !== undefined) {
			entries.set(field, { path: ["weapon_info", field], value });
		}
	}
	return entries;
}

function heroEntries(hero: Hero): StatEntries {
	const entries: StatEntries = new Map();
	for (const [stat, { value }] of Object.entries(hero.starting_stats ?? {})) {
		entries.set(`starting_stats.${stat}`, {
			path: ["starting_stats", stat, "value"],
			value,
		});
	}
	for (const [stat, value] of Object.entries(
		hero.standard_level_up_upgrades ?? {},
	)) {
		entries.set(`standard_level_up_upgrades.${stat}`, {
			path: ["standard_level_up_upgrades", stat],
			value,
		});
	}
	return entries;
}

function abilityEntries(ability: Item): StatEntries {
	const entries: StatEntries = new Map();
	for (const [key, { value, scale_function }] of Object.entries(
		ability.properties ?? {},
	)) {
		entries.set(`properties.${key}`, {
			path: ["properties", key, "value"],
			value,
		});
		const scale = scale_function?.stat_scale;
		if (typeof scale === "number") {
			entries.set(`properties.${key}.stat_scale`, {
				path: ["properties", key, "scale_function", "stat_scale"],
				value: scale,
			});
		}
	}
	return entries;
}

/** One cache per builder: the same item feeds both weapon and ability entries. */
const memoize = <T extends object>(build: (record: T) => StatEntries) => {
	const cache = new WeakMap<T, StatEntries>();
	return (record: T) => {
		let entries = cache.get(record);
		if (!entries) {
			entries = build(record);
			cache.set(record, entries);
		}
		return entries;
	};
};

/** Every field id any record in the population reports. */
const fieldsOf = (population: StatEntries[]) => {
	const fields = new Set<string>();
	for (const entries of population) {
		for (const field of entries.keys()) fields.add(field);
	}
	return fields;
};

const isEmpty = isEmptyStatValue;

/**
 * One pass over the union of both records' fields - O(fields), every lookup a
 * Map/Set hit. `prevFields`/`nextFields` are the schema of the whole previous
 * and current population, which is what tells "the API started (or stopped)
 * reporting this" apart from "this one hero gained (or lost) it".
 */
function diffEntries(
	before: StatEntries,
	after: StatEntries,
	prevFields: Set<string>,
	nextFields: Set<string>,
): Change[] {
	const changes: Change[] = [];
	for (const [field, { path, value }] of after) {
		const previous = before.get(field);
		if (previous === undefined) {
			if (!isEmpty(value) && prevFields.has(field)) {
				changes.push({ path, kind: "added", new: value });
			}
		} else if (
			!(isEmpty(previous.value) && isEmpty(value)) &&
			String(previous.value) !== String(value)
		) {
			changes.push({
				path,
				kind: "modified",
				old: previous.value,
				new: value,
			});
		}
	}
	for (const [field, { path, value }] of before) {
		if (after.has(field) || isEmpty(value)) continue;
		if (nextFields.has(field)) {
			changes.push({ path, kind: "removed", old: value });
		}
	}
	return changes;
}

/** Casing-only rewrites are not a change - same rule as `diffItems`. */
const sectionText = (html: string) => prose(html).toLowerCase();

/**
 * Section-by-section diff of the ability's tooltip text. Sections are matched
 * by position; one that exists on only one side is added/removed.
 */
function textChanges(before: Item, after: Item): Change[] {
	const previous = before.tooltip_details?.info_sections ?? [];
	const current = after.tooltip_details?.info_sections ?? [];
	const changes: Change[] = [];
	for (let index = 0; index < Math.max(previous.length, current.length); index++) {
		const oldHtml = previous[index]?.loc_string ?? "";
		const newHtml = current[index]?.loc_string ?? "";
		if (sectionText(oldHtml) === sectionText(newHtml)) continue;
		changes.push({
			path: ["tooltip_details", "info_sections", String(index), "loc_string"],
			kind: !oldHtml ? "added" : !newHtml ? "removed" : "modified",
			...(oldHtml && { old: oldHtml }),
			...(newHtml && { new: newHtml }),
		});
	}
	return changes;
}

/**
 * Everything the Changes page renders per hero, for live heroes that changed.
 * Heroes absent from `prevHeroes` are skipped - there is no baseline to diff
 * (the same rule the raw diff applied: only `modified` heroes counted).
 */
export function buildHeroChanges(
	prevHeroes: Hero[],
	heroes: Hero[],
	prevItems: Item[],
	items: Item[],
	tiersByName: Record<string, TierDiff[]>,
): Record<string, HeroChanges> {
	const prevHeroByName = new Map(prevHeroes.map((hero) => [hero.name, hero]));
	const prevItemByClass = new Map(
		prevItems.map((item) => [item.class_name, item]),
	);
	const itemByClass = new Map(items.map((item) => [item.class_name, item]));

	// Entries are built once per record and reused for both the schema sets and
	// the per-hero diff - the payloads are ~700 items, so this is the hot path.
	const heroStats = memoize(heroEntries);
	const weaponStats = memoize((item: Item) => weaponEntries(item.weapon_info));
	const abilityStats = memoize(abilityEntries);

	const heroFields = {
		prev: fieldsOf(prevHeroes.map(heroStats)),
		next: fieldsOf(heroes.map(heroStats)),
	};
	const weaponsOf = (list: Item[]) => list.filter((item) => item.weapon_info);
	const weaponFields = {
		prev: fieldsOf(weaponsOf(prevItems).map(weaponStats)),
		next: fieldsOf(weaponsOf(items).map(weaponStats)),
	};
	const propertyFields = {
		prev: fieldsOf(prevItems.map(abilityStats)),
		next: fieldsOf(items.map(abilityStats)),
	};

	const out: Record<string, HeroChanges> = {};

	for (const hero of heroes) {
		if (!isLiveHero(hero)) continue;
		const { name, items: slots } = hero;
		const previousHero = prevHeroByName.get(name);
		if (!previousHero) continue;
		// The page drops a hero whose ability slot fails to resolve rather than
		// render it half-empty, so it must not count toward the badge either.
		const slotClasses = ABILITY_SLOTS.map((slot) => slots?.[slot]).filter(
			Boolean,
		);
		if (
			slotClasses.length === 0 ||
			slotClasses.some((className) => !itemByClass.has(className))
		) {
			continue;
		}

		const stats = diffEntries(
			heroStats(previousHero),
			heroStats(hero),
			heroFields.prev,
			heroFields.next,
		);

		const weaponClass = slots?.[WEAPON_SLOT];
		const weapon = itemByClass.get(weaponClass);
		const previousWeapon = prevItemByClass.get(weaponClass);
		const weaponChanges =
			weapon && previousWeapon
				? diffEntries(
						weaponStats(previousWeapon),
						weaponStats(weapon),
						weaponFields.prev,
						weaponFields.next,
					)
				: [];

		const abilities: Record<string, Change[]> = {};
		let tiersChanged = false;
		for (const className of slotClasses) {
			const ability = itemByClass.get(className);
			const previousAbility = prevItemByClass.get(className);
			if (!ability || !previousAbility) continue;

			const changes = diffEntries(
				abilityStats(previousAbility),
				abilityStats(ability),
				propertyFields.prev,
				propertyFields.next,
			);
			changes.push(...textChanges(previousAbility, ability));
			if (changes.length > 0) abilities[ability.name] = changes;
			if (hasTierChanges(tiersByName[ability.name] ?? [])) tiersChanged = true;
		}

		if (
			stats.length > 0 ||
			weaponChanges.length > 0 ||
			tiersChanged ||
			Object.keys(abilities).length > 0
		) {
			out[name] = { stats, weapon: weaponChanges, abilities };
		}
	}

	return out;
}
