import UpcomingHeroes from "#/shared/components/upcoming-heroes";
import type { Hero, HeroEntry } from "#/types";
import HeroProfileCard from "./hero-profile-card";

export default function Heroes({
	heroesData,
	upcoming,
}: {
	heroesData: HeroEntry[];
	/** Announced, not yet playable - shown above the live roster. */
	upcoming: Hero[];
}) {
	const sorted = [...heroesData].sort(({ hero: a }, { hero: b }) =>
		a.name.localeCompare(b.name),
	);

	return (
		<main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
			<h1 className="mb-1 font-extrabold text-2xl">All Deadlock Heroes</h1>
			<p className="mb-6 text-gray-400 text-sm">
				Explore hero stats for every Deadlock hero — starting stats, leveling
				growth, weapons, and ability upgrade tiers.
			</p>
			{upcoming.length > 0 && (
				<section className="mb-8">
					<h2 className="mb-3 font-bold text-xl">Coming soon</h2>
					<UpcomingHeroes heroes={upcoming} />
				</section>
			)}
			<p className="mb-4 text-gray-400 text-sm">
				{sorted.length} live hero{sorted.length === 1 ? "" : "es"}
			</p>
			<div className="masonary">
				{sorted.map(({ hero, abilities }) => (
					<HeroProfileCard key={hero.id} hero={hero} abilities={abilities} />
				))}
			</div>
		</main>
	);
}
