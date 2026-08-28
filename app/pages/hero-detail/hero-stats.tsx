import StatRow from "#/shared/components/hero-stat-row";
import { PRIMARY_STATS } from "#/shared/components/hero-stat-row/constants";
import { labelForStatKey } from "#/shared/utils/statLabels";
import type { Hero } from "#/types";

const isPrimary = (key: string): key is (typeof PRIMARY_STATS)[number] =>
	(PRIMARY_STATS as readonly string[]).includes(key);

/**
 * Starting stats for the hero detail page - same primary/secondary split
 * `HeroProfileCard` uses (`PRIMARY_STATS`, `StatRow`, `labelForStatKey`), just
 * laid out as its own section instead of a compact card. Secondary stats sit
 * behind a collapsed `<details>`, uncontrolled - there is no "expand all"
 * concept on a single-hero page, so no state is needed here.
 */
export default function HeroStats({ hero }: { hero: Hero }) {
	const primaryRows = PRIMARY_STATS.flatMap((key) => {
		const stat = hero.starting_stats[key];
		return stat
			? [{ key, label: labelForStatKey(key), value: stat.value }]
			: [];
	});
	const otherStatRows = Object.entries(hero.starting_stats)
		.filter(([key]) => !isPrimary(key))
		.map(([key, stat]) => ({
			key,
			label: labelForStatKey(key),
			value: stat.value,
		}));

	return (
		<div className="flex flex-col gap-0.5 rounded-md bg-[#1b1b24]">
			<div className="flex flex-col gap-0.5 py-1">
				{primaryRows.map((row) => (
					<StatRow key={row.key} label={row.label} value={row.value} />
				))}
			</div>

			<details className="px-2.5 py-1.5">
				<summary className="cursor-pointer select-none text-gray-400 text-xs">
					All stats
				</summary>
				<div className="mt-1 flex flex-col gap-0.5">
					{otherStatRows.map((row) => (
						<StatRow key={row.key} label={row.label} value={row.value} />
					))}
				</div>
			</details>
		</div>
	);
}
