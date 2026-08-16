import { PRIMARY_STATS } from "#/components/hero-profile-card/constants";
import type { Hero } from "#/types";
import { isNegativeHeroStat, labelForStatKey } from "#/utils/statLabels";

export type CompareRow = {
	key: string;
	label: string;
	/** Aligned to the hero order passed in - `undefined` where a hero lacks the stat. */
	values: (number | undefined)[];
	/** Indexes of the standout value(s) for this row - empty when there's nothing to highlight. */
	bestIndexes: number[];
};

const isPrimary = (key: string): key is (typeof PRIMARY_STATS)[number] =>
	(PRIMARY_STATS as readonly string[]).includes(key);

/**
 * The standout value(s) for a stat row - the max, or the min for stats where
 * lower is better (`isNegativeHeroStat`, same direction rule the hero card
 * deltas use). Empty when there is nothing to highlight: fewer than two
 * defined values, or every defined value ties.
 */
function bestIndexes(key: string, values: (number | undefined)[]): number[] {
	const defined = values
		.map((value, index) => ({ value, index }))
		.filter(
			(entry): entry is { value: number; index: number } =>
				entry.value !== undefined,
		);
	if (defined.length < 2) return [];

	const target = isNegativeHeroStat(key)
		? Math.min(...defined.map((entry) => entry.value))
		: Math.max(...defined.map((entry) => entry.value));
	const winners = defined.filter((entry) => entry.value === target);
	if (winners.length === defined.length) return []; // everyone tied

	return winners.map((entry) => entry.index);
}

const buildRow = (key: string, values: (number | undefined)[]): CompareRow => ({
	key,
	label: labelForStatKey(key),
	values,
	bestIndexes: bestIndexes(key, values),
});

/** The 8 stats a player actually compares heroes on - always present, so this never has gaps. */
function coreStatRows(heroes: Hero[]): CompareRow[] {
	return PRIMARY_STATS.map((key) =>
		buildRow(
			key,
			heroes.map((hero) => hero.starting_stats[key]?.value),
		),
	);
}

/** Every other `starting_stats` key any selected hero has, union'd across the selection. */
function otherStatRows(heroes: Hero[]): CompareRow[] {
	const keys = new Set<string>();
	for (const hero of heroes) {
		for (const key of Object.keys(hero.starting_stats)) {
			if (!isPrimary(key)) keys.add(key);
		}
	}
	return [...keys]
		.sort((a, b) => labelForStatKey(a).localeCompare(labelForStatKey(b)))
		.map((key) =>
			buildRow(
				key,
				heroes.map((hero) => hero.starting_stats[key]?.value),
			),
		);
}

/**
 * Unlike `HeroProfileCard` (which drops an individual hero's zero-valued
 * level-up rows so its own card doesn't carry dead weight), a key is only
 * dropped from the comparison when EVERY selected hero is at 0 - a 0 next to
 * a rival's real number is exactly the kind of gap this view exists to show.
 */
function levelUpRows(heroes: Hero[]): CompareRow[] {
	const keys = new Set<string>();
	for (const hero of heroes) {
		for (const [key, value] of Object.entries(
			hero.standard_level_up_upgrades,
		)) {
			if (value !== 0) keys.add(key);
		}
	}
	return [...keys]
		.sort((a, b) => labelForStatKey(a).localeCompare(labelForStatKey(b)))
		.map((key) =>
			buildRow(
				key,
				heroes.map((hero) => hero.standard_level_up_upgrades[key]),
			),
		);
}

export type CompareSection = { title: string; rows: CompareRow[] };

/** Every stat heading the table displays, grouped and in display order - the table is exhaustive, not paginated or filtered. */
export function compareSections(heroes: Hero[]): CompareSection[] {
	return [
		{ title: "Core stats", rows: coreStatRows(heroes) },
		{ title: "Other stats", rows: otherStatRows(heroes) },
		{ title: "Per level", rows: levelUpRows(heroes) },
	];
}
