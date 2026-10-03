import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import Compare from "#/pages/compare";
import { fetchCompareHeroes } from "#/server/heroes";
import { seoHead } from "#/shared/utils/seoHead";
import type { CompareHero } from "#/types";

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

export const Route = createFileRoute("/_layout/compare")({
	validateSearch: (search: Record<string, unknown>) => ({
		heroes: parseHeroes(search.heroes),
	}),
	// An empty selection is the default state - keep `?heroes=[]` out of the
	// URL rather than leaving a no-op query string behind.
	search: { middlewares: [stripSearchParams({ heroes: [] })] },
	head: () =>
		seoHead({
			title:
				"Hero Comparison Tool - Compare Deadlock Hero Stats | Deadlock Patch Comparator",
			description:
				"Side-by-side base stat and ability comparison tool for Deadlock heroes. Compare health, weapon damage, spirit scaling, and mobility stats.",
			path: "/compare",
		}),
	loader: async () => fetchCompareHeroes(),
	component: RouteComponent,
});

function RouteComponent() {
	// Annotated for the same reason as the other routes: the generated route
	// tree and `useLoaderData()` reference each other, so inference yields `any`.
	const heroesData: CompareHero[] = Route.useLoaderData();
	return <Compare heroes={heroesData} />;
}
