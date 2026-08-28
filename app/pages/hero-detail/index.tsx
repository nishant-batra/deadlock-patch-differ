import { Link } from "@tanstack/react-router";
import type { HeroEntry } from "#/types";
import HeroAbilities from "./hero-abilities";
import HeroLevelUp from "./hero-level-up";
import HeroPortrait from "./hero-portrait";
import HeroStats from "./hero-stats";

export default function HeroDetail({ hero, abilities }: HeroEntry) {
	return (
		<main className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
			<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
				<p className="text-gray-400 text-sm">
					<Link to="/heroes" className="underline hover:text-white">
						Heroes
					</Link>{" "}
					/ <span className="text-gray-100">{hero.name}</span>
				</p>
				<Link
					to="/compare"
					search={{ heroes: [hero.class_name] }}
					className="rounded-xl border border-amber-500 p-2 font-bold"
				>
					Compare heroes
				</Link>
			</div>

			<header className="mb-6 flex items-center gap-4">
				<HeroPortrait hero={hero} />
				<h1 className="font-extrabold text-3xl">{hero.name}</h1>
			</header>

			<section className="mb-8">
				<h2 className="mb-2 font-bold text-xl">Starting Stats</h2>
				<HeroStats hero={hero} />
			</section>

			<section className="mb-8">
				<h2 className="mb-2 font-bold text-xl">Level-Up Growth</h2>
				<HeroLevelUp hero={hero} />
			</section>

			<section className="mb-8">
				<h2 className="mb-2 font-bold text-xl">Abilities</h2>
				<HeroAbilities abilities={abilities} />
			</section>

			<div className="mt-8 text-center">
				<Link
					to="/compare"
					search={{ heroes: [hero.class_name] }}
					className="rounded-xl border border-amber-500 p-2 font-bold"
				>
					Compare {hero.name} with another hero →
				</Link>
			</div>
		</main>
	);
}
