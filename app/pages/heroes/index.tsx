import SearchInput from "#/shared/components/search-input";
import { useScrollTargets } from "#/shared/components/search-input/useScrollTargets";
import UpcomingHeroes from "#/shared/components/upcoming-heroes";
import { accentOf } from "#/shared/utils/heroAccent";
import { stickyBarRef } from "#/shared/utils/stickyBarRef";
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
	const { targetRef, scrollTo } = useScrollTargets();
	const sorted = [...heroesData].sort(({ hero: a }, { hero: b }) =>
		a.name.localeCompare(b.name),
	);
	const entries = sorted.map(({ hero }) => ({
		name: hero.name,
		icon: hero.images?.icon_hero_card_webp ?? hero.images?.icon_hero_card,
		color: accentOf(hero),
	}));

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
			{/* Page-coloured so cards scrolling up are hidden behind the bar. */}
			<div
				ref={stickyBarRef}
				className="sticky top-(--nav-height) z-10 mb-1 flex flex-wrap items-center gap-2 bg-[#0e0e13] py-3"
			>
				<p className="text-gray-400 text-sm">
					{sorted.length} live hero{sorted.length === 1 ? "" : "es"}
				</p>
				<SearchInput
					entries={entries}
					onSelect={scrollTo}
					placeholder="Search heroes"
					className="ml-auto w-full sm:w-72"
				/>
			</div>
			{/* Search jumps land a card below the bars (3.5rem on one row), a
			    card-gap clear. */}
			<div className="masonary [&>*]:scroll-mt-[calc(var(--nav-height)+var(--sticky-bar-height,3.5rem)+0.75rem)]">
				{sorted.map(({ hero, abilities }) => (
					<HeroProfileCard
						key={hero.id}
						hero={hero}
						abilities={abilities}
						ref={targetRef(hero.name)}
					/>
				))}
			</div>
		</main>
	);
}
