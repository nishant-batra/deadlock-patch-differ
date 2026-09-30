import type { Hero } from "#/types";
import UpcomingHeroCard from "./upcoming-hero-card";

/** The "coming soon" grid shared by `/heroes` and the Changes page. */
export default function UpcomingHeroes({ heroes }: { heroes: Hero[] }) {
	return (
		<ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{heroes.map((hero) => (
				<li key={hero.id} className="flex min-w-0">
					<UpcomingHeroCard hero={hero} />
				</li>
			))}
		</ul>
	);
}
