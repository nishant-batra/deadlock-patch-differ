import StatRow from "#/shared/components/hero-stat-row";
import { labelForStatKey } from "#/shared/utils/statLabels";
import type { Hero } from "#/types";

/**
 * Level-up growth stats - what a hero gains per level, not what it starts
 * with. `standard_level_up_upgrades` is full of zero-valued entries a hero
 * simply doesn't use; they're filtered out so this never shows dead rows.
 */
export default function HeroLevelUp({ hero }: { hero: Hero }) {
	const rows = Object.entries(hero.standard_level_up_upgrades)
		.filter(([, value]) => value !== 0)
		.map(([key, value]) => ({ key, label: labelForStatKey(key), value }));

	if (rows.length === 0) return null;

	return (
		<div className="flex flex-col gap-0.5 rounded-md bg-[#1b1b24] py-1">
			{rows.map((row) => (
				<StatRow key={row.key} label={row.label} value={row.value} />
			))}
		</div>
	);
}
