import { createFileRoute } from "@tanstack/react-router";
import Heroes from "#/pages/heroes";
import { fetchChangedHeroNames, fetchHeroes } from "#/server/heroes";
import type { HeroEntry } from "#/types";

type HeroesLoaderData = { heroes: HeroEntry[]; changedNames: string[] };

export const Route = createFileRoute("/_layout/heroes")({
	head: ({ loaderData }: { loaderData?: HeroesLoaderData }) => {
		const heroCount = loaderData?.heroes.length ?? 0;
		const title = `All ${heroCount > 0 ? `${heroCount} ` : ""}Deadlock Heroes — Base Stats, Abilities & Upgrades | Deadlock Patch Comparator`;
		const description = `Complete catalog of all ${heroCount > 0 ? `${heroCount} ` : ""}live Deadlock heroes. View starting stats, leveling growth, weapon info, and ability upgrade tiers.`;

		return {
			meta: [
				{ title },
				{ name: "description", content: description },
				{
					name: "robots",
					content:
						"index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
				},
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
				{
					property: "og:url",
					content: "https://deadlockpatch.vercel.app/heroes",
				},
				{ name: "twitter:title", content: title },
				{ name: "twitter:description", content: description },
			],
			links: [
				{ rel: "canonical", href: "https://deadlockpatch.vercel.app/heroes" },
			],
		};
	},
	loader: async () => {
		const [heroes, changedNames] = await Promise.all([
			fetchHeroes(),
			fetchChangedHeroNames(),
		]);
		return { heroes, changedNames };
	},
	component: RouteComponent,
});

function RouteComponent() {
	// Annotated for the same reason as the other routes: the generated route
	// tree and `useLoaderData()` reference each other, so inference yields `any`.
	const { heroes, changedNames }: HeroesLoaderData = Route.useLoaderData();
	return <Heroes heroesData={heroes} changedNames={changedNames} />;
}
