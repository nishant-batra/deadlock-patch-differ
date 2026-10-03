import type { CompareHero } from "#/types";
import HeroSelect from "./hero-select";
import StatTable from "./stat-table";
import { useCompareSelection } from "./useCompareSelection";

export default function Compare({ heroes }: { heroes: CompareHero[] }) {
	const { slots, setSlot, selected } = useCompareSelection();

	const sortedHeroes = heroes
		.map(({ hero }) => hero)
		.sort((a, b) => a.name.localeCompare(b.name));
	const entryByClassName = new Map(
		heroes.map((entry) => [entry.hero.class_name, entry]),
	);
	// An unknown class name in the URL (stale link, hand-edited) just drops out.
	const selectedEntries = selected
		.map((className) => entryByClassName.get(className))
		.filter((entry): entry is CompareHero => Boolean(entry));

	return (
		<main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
			<h1 className="mb-1 font-extrabold text-2xl">Deadlock Hero Comparison</h1>
			<p className="mb-6 text-gray-400 text-sm">
				Compare Deadlock hero stats side by side — health, weapon damage, spirit
				scaling, and mobility.
			</p>
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
										(other, i): other is string =>
											i !== index && Boolean(other),
									),
								)
							}
							onChange={(next) => setSlot(index, next)}
						/>
					))}
				</div>

				{selectedEntries.length > 0 ? (
					<StatTable entries={selectedEntries} />
				) : (
					<p className="text-gray-400">
						Pick two or three heroes to compare their stats.
					</p>
				)}
			</div>
		</main>
	);
}
