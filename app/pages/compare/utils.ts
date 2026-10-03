import { PRIMARY_STATS } from "#/shared/components/hero-stat-row/constants";
import { isPrimaryStat } from "#/shared/components/hero-stat-row/utils";
import {
	COMPLEXITY_MAX,
	type DisplayRow,
	scalingRows,
	weaponRows,
} from "#/shared/utils/heroDisplayRows";
import { isNegativeHeroStat, labelForStatKey } from "#/shared/utils/statLabels";
import type { CompareHero, Hero } from "#/types";

type Cell = number | string | undefined;

export type CompareRow = {
	key: string;
	label: string;
	/** Aligned to the hero order passed in - `undefined` where a hero lacks the stat. */
	values: Cell[];
	/** Indexes of the standout value(s) for this row - empty when there's nothing to highlight. */
	bestIndexes: number[];
};

/**
 * The standout value(s) for a stat row - the max, or the min for stats where
 * lower is better (`isNegativeHeroStat`, same direction rule the hero card
 * deltas use). Empty when there is nothing to highlight: fewer than two
 * defined values, every defined value ties, or the row holds text (tags,
 * formatted weapon readouts) that has no "better".
 */
function bestIndexes(key: string, values: Cell[]): number[] {
	const defined = values.flatMap((value, index) =>
		value === undefined ? [] : [{ value, index }],
	);
	if (defined.length < 2) return [];
	if (defined.some(({ value }) => typeof value !== "number")) return [];
	const numbers = defined.map(({ value }) => value as number);

	const target = isNegativeHeroStat(key)
		? Math.min(...numbers)
		: Math.max(...numbers);
	const winners = defined.filter(({ value }) => value === target);
	if (winners.length === defined.length) return []; // everyone tied

	return winners.map(({ index }) => index);
}

const buildRow = (
	key: string,
	values: Cell[],
	label = labelForStatKey(key),
): CompareRow => ({
	key,
	label,
	values,
	bestIndexes: bestIndexes(key, values),
});

/** Identity, not numbers - nothing here is highlighted. */
const profileRows = (heroes: Hero[]): CompareRow[] => [
	buildRow(
		"tags",
		heroes.map(({ tags }) => tags?.join(", ")),
		"Tags",
	),
	buildRow(
		"gun_tag",
		heroes.map(({ gun_tag }) => gun_tag),
		"Gun type",
	),
	buildRow(
		"complexity",
		heroes.map(({ complexity }) =>
			complexity === undefined
				? undefined
				: `${complexity} / ${COMPLEXITY_MAX}`,
		),
		"Complexity",
	),
];

/** The 8 stats a player actually compares heroes on - always present, so this never has gaps. */
const coreStatRows = (heroes: Hero[]): CompareRow[] =>
	PRIMARY_STATS.map((key) =>
		buildRow(
			key,
			heroes.map(({ starting_stats }) => starting_stats[key]?.value),
		),
	);

/** Every other `starting_stats` key any selected hero has, union'd across the selection. */
function otherStatRows(heroes: Hero[]): CompareRow[] {
	const keys = new Set<string>();
	for (const { starting_stats } of heroes) {
		for (const key of Object.keys(starting_stats)) {
			if (!isPrimaryStat(key)) keys.add(key);
		}
	}
	return [...keys]
		.sort((a, b) => labelForStatKey(a).localeCompare(labelForStatKey(b)))
		.map((key) =>
			buildRow(
				key,
				heroes.map(({ starting_stats }) => starting_stats[key]?.value),
			),
		);
}

/**
 * Per-hero display rows (gun, scaling) merged into one row per key, in the
 * order they first appear - `weaponRows` already lists the gun stats in
 * in-game sheet order, so that order is kept rather than re-sorted.
 */
function unionRows(
	entries: CompareHero[],
	rowsOf: (entry: CompareHero) => DisplayRow[],
): CompareRow[] {
	const perHero = entries.map(
		(entry) => new Map(rowsOf(entry).map((row) => [row.key, row])),
	);
	const labels = new Map<string, string>();
	for (const rows of perHero) {
		for (const { key, label } of rows.values()) {
			if (!labels.has(key)) labels.set(key, label);
		}
	}
	return [...labels].map(([key, label]) =>
		buildRow(
			key,
			perHero.map((rows) => rows.get(key)?.value),
			label,
		),
	);
}

const weaponCompareRows = (entries: CompareHero[]) =>
	unionRows(entries, ({ weapon }) =>
		weapon ? weaponRows(weapon.weapon_info) : [],
	);

const scalingCompareRows = (entries: CompareHero[]) =>
	unionRows(entries, ({ hero }) => scalingRows(hero.scaling_stats ?? {}));

/**
 * Unlike the hero page (which drops an individual hero's zero-valued
 * level-up rows so it doesn't carry dead weight), a key is only dropped from
 * the comparison when EVERY selected hero is at 0 - a 0 next to a rival's
 * real number is exactly the kind of gap this view exists to show.
 */
function levelUpRows(heroes: Hero[]): CompareRow[] {
	const keys = new Set<string>();
	for (const { standard_level_up_upgrades } of heroes) {
		for (const [key, value] of Object.entries(standard_level_up_upgrades)) {
			if (value !== 0) keys.add(key);
		}
	}
	return [...keys]
		.sort((a, b) => labelForStatKey(a).localeCompare(labelForStatKey(b)))
		.map((key) =>
			buildRow(
				key,
				heroes.map(
					({ standard_level_up_upgrades }) => standard_level_up_upgrades[key],
				),
			),
		);
}

export type CompareSection = { title: string; rows: CompareRow[] };

/**
 * Every stat heading the table displays, grouped and in display order. A
 * section with no rows for this selection (no hero scales a stat) is dropped
 * rather than shown as an empty heading.
 */
export function compareSections(entries: CompareHero[]): CompareSection[] {
	const heroes = entries.map(({ hero }) => hero);
	return [
		{ title: "Profile", rows: profileRows(heroes) },
		{ title: "Core stats", rows: coreStatRows(heroes) },
		{ title: "Weapon", rows: weaponCompareRows(entries) },
		{ title: "Other stats", rows: otherStatRows(heroes) },
		{ title: "Stat scaling", rows: scalingCompareRows(entries) },
		{ title: "Per level", rows: levelUpRows(heroes) },
	].filter(({ rows }) => rows.length > 0);
}
