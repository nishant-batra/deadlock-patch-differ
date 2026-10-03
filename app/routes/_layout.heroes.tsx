import { createFileRoute } from "@tanstack/react-router";
import Heroes from "#/pages/heroes";
import { fetchHeroes, fetchUpcomingHeroes } from "#/server/heroes";
import { seoHead } from "#/shared/utils/seoHead";
import type { Hero, HeroEntry } from "#/types";

type HeroesLoaderData = {
	heroes: HeroEntry[];
	upcoming: Hero[];
};

export const Route = createFileRoute("/_layout/heroes")({
	head: ({ loaderData }: { loaderData?: HeroesLoaderData }) => {
		const heroCount = loaderData?.heroes.length ?? 0;
		const title = `All ${heroCount > 0 ? `${heroCount} ` : ""}Deadlock Heroes - Base Stats, Abilities & Upgrades | Deadlock Patch Comparator`;
		const description = `Complete catalog of all ${heroCount > 0 ? `${heroCount} ` : ""}live Deadlock heroes. View starting stats, leveling growth, weapon info, and ability upgrade tiers.`;

		return seoHead({ title, description, path: "/heroes" });
	},
	loader: async () => {
		const [heroes, upcoming] = await Promise.all([
			fetchHeroes(),
			fetchUpcomingHeroes(),
		]);
		return { heroes, upcoming };
	},
	component: RouteComponent,
});

function RouteComponent() {
	// Annotated for the same reason as the other routes: the generated route
	// tree and `useLoaderData()` reference each other, so inference yields `any`.
	const { heroes, upcoming }: HeroesLoaderData = Route.useLoaderData();
	return <Heroes heroesData={heroes} upcoming={upcoming} />;
}
