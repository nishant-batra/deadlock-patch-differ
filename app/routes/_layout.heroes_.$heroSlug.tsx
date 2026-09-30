import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import HeroDetail from "#/pages/hero-detail";
import UpcomingHeroDetail from "#/pages/upcoming-hero-detail";
import { fetchHeroPage } from "#/server/heroes";
import CutFrame from "#/shared/components/cut-frame";
import { AMBER_BORDER } from "#/shared/components/cut-frame/constants";
import { heroSlug } from "#/shared/utils/heroSlug";
import type { HeroPage } from "#/types";

export const Route = createFileRoute("/_layout/heroes_/$heroSlug")({
	loader: async ({ params: { heroSlug: slug } }): Promise<HeroPage> => {
		// Looks up the one hero by slug server-side, rather than shipping the
		// whole roster to the loader to search it.
		const page = await fetchHeroPage({ data: slug });
		if (!page) throw notFound();
		return page;
	},
	head: ({ loaderData }: { loaderData?: HeroPage }) => {
		const hero =
			loaderData?.kind === "live" ? loaderData.entry.hero : loaderData?.hero;

		// `loaderData` is undefined when the loader threw `notFound()` - a bad
		// slug should never be indexed as if it were a real hero page.
		if (!hero) {
			return {
				meta: [
					{ title: "Hero not found | Deadlock Patch Comparator" },
					{ name: "robots", content: "noindex, follow" },
				],
			};
		}

		const { name, tags } = hero;
		const slug = heroSlug(name);
		const upcoming = loaderData?.kind === "upcoming";
		const title = upcoming
			? `${name} — Upcoming Deadlock Hero | Deadlock Patch Comparator`
			: `${name} — Deadlock Hero Stats, Abilities & Upgrades | Deadlock Patch Comparator`;
		const tagline = tags?.length ? ` (${tags.join(", ")})` : "";
		const description = upcoming
			? `${name}${tagline} is an upcoming Deadlock hero. Stats, abilities and upgrades will be listed here as soon as ${name} is released.`
			: `${name}'s Deadlock stats and abilities: starting stats, leveling growth, and all ability upgrade tiers.`;

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
					content: `https://deadlockpatch.vercel.app/heroes/${slug}`,
				},
				{ name: "twitter:title", content: title },
				{ name: "twitter:description", content: description },
			],
			links: [
				{
					rel: "canonical",
					href: `https://deadlockpatch.vercel.app/heroes/${slug}`,
				},
			],
		};
	},
	notFoundComponent: () => (
		<main className="mx-auto max-w-7xl px-4 py-16 text-center">
			<h1 className="mb-2 font-extrabold text-2xl">Hero not found</h1>
			<p className="mb-6 text-gray-400">We couldn't find a hero at this URL.</p>
			<CutFrame color={AMBER_BORDER}>
				<Link to="/heroes" className="cut-corner px-3 py-1.5 font-bold">
					Back to all heroes
				</Link>
			</CutFrame>
		</main>
	),
	component: RouteComponent,
});

function RouteComponent() {
	// Annotated for the same reason as the other routes: the generated route
	// tree and `useLoaderData()` reference each other, so inference yields `any`.
	const page: HeroPage = Route.useLoaderData();
	return page.kind === "live" ? (
		<HeroDetail {...page.entry} />
	) : (
		<UpcomingHeroDetail hero={page.hero} />
	);
}
