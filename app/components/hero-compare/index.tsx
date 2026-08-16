import type { Hero, HeroEntry } from "#/types";
import HeroSelect from "./hero-select";
import StatTable from "./stat-table";
import { useCompareSelection } from "./useCompareSelection";

/**
 * Three hero pickers (URL-backed, up to 3) plus their core stats side by
 * side. Stats only - abilities are left out on purpose: most are pruned to
 * icon-only stubs outside a patch (see patchService.ts), and the upgrade
 * tiers squeeze badly at narrow column widths (see ability-popover/tier-block.tsx).
 */
export default function HeroCompare({ heroes }: { heroes: HeroEntry[] }) {
	const { slots, setSlot, selected } = useCompareSelection();

	const sortedHeroes = heroes
		.map((entry) => entry.hero)
		.sort((a, b) => a.name.localeCompare(b.name));
	const heroByClassName = new Map(
		sortedHeroes.map((hero) => [hero.class_name, hero]),
	);
	// An unknown class name in the URL (stale link, hand-edited) just drops out.
	const selectedHeroes = selected
		.map((className) => heroByClassName.get(className))
		.filter((hero): hero is Hero => Boolean(hero));

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap gap-2">
				{slots.map((value, index) => (
					<HeroSelect
						// biome-ignore lint/suspicious/noArrayIndexKey: a slot's identity is its fixed position (0/1/2), not the hero in it.
						key={index}
						index={index}
						heroes={sortedHeroes}
						value={value}
						taken={
							new Set(
								slots.filter(
									(other, i): other is string => i !== index && Boolean(other),
								),
							)
						}
						onChange={(next) => setSlot(index, next)}
					/>
				))}
			</div>

			{selectedHeroes.length > 0 ? (
				<StatTable heroes={selectedHeroes} />
			) : (
				<p className="text-gray-400">
					Pick two or three heroes to compare their stats.
				</p>
			)}
		</div>
	);
}
