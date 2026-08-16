import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import HeroCompare from "#/components/hero-compare";
import { fetchHeroes } from "#/server/fetchHeroes";
import type { HeroEntry } from "#/types";

const MAX_HEROES = 3;

/**
 * `?heroes=a,b,c`. The router may hand back a string or (depending on how the
 * link was built) an array, so both are accepted. Deduped and hard-capped at
 * 3 so a hand-edited URL can't blow out the comparison layout.
 */
function parseHeroes(raw: unknown): string[] {
	const list = Array.isArray(raw)
		? raw
		: typeof raw === "string"
			? raw.split(",")
			: [];
	return [
		...new Set(
			list
				.map(String)
				.map((value) => value.trim())
				.filter(Boolean),
		),
	].slice(0, MAX_HEROES);
}

export const Route = createFileRoute("/compare")({
	validateSearch: (search: Record<string, unknown>) => ({
		heroes: parseHeroes(search.heroes),
	}),
	// An empty selection is the default state - keep `?heroes=[]` out of the
	// URL rather than leaving a no-op query string behind.
	search: { middlewares: [stripSearchParams({ heroes: [] })] },
	head: () => ({
		meta: [
			{
				title:
					"Hero Comparison Tool — Compare Deadlock Hero Stats | Deadlock Patch Comparator",
			},
			{
				name: "description",
				content:
					"Side-by-side base stat and ability comparison tool for Deadlock heroes. Compare health, weapon damage, spirit scaling, and mobility stats.",
			},
			{
				name: "robots",
				content:
					"index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
			},
			{
				property: "og:title",
				content:
					"Hero Comparison Tool — Compare Deadlock Hero Stats | Deadlock Patch Comparator",
			},
			{
				property: "og:description",
				content:
					"Side-by-side base stat and ability comparison tool for Deadlock heroes. Compare health, weapon damage, spirit scaling, and mobility stats.",
			},
			{ property: "og:url", content: "https://deadlockpatch.vercel.app/compare" },
			{
				name: "twitter:title",
				content:
					"Hero Comparison Tool — Compare Deadlock Hero Stats | Deadlock Patch Comparator",
			},
			{
				name: "twitter:description",
				content:
					"Side-by-side base stat and ability comparison tool for Deadlock heroes. Compare health, weapon damage, spirit scaling, and mobility stats.",
			},
		],
		links: [{ rel: "canonical", href: "https://deadlockpatch.vercel.app/compare" }],
	}),
	loader: async () => fetchHeroes(),
	component: Compare,
});

function Compare() {
	// Annotated for the same reason as the other routes: the generated route
	// tree and `useLoaderData()` reference each other, so inference yields `any`.
	const heroesData: HeroEntry[] = Route.useLoaderData();

	return (
		<main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
			<h2 className="mb-4 font-extrabold text-xl">Compare heroes</h2>
			<HeroCompare heroes={heroesData} />
		</main>
	);
}
