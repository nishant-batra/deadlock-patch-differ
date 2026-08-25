import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import HeroAbilities from "#/components/hero-detail/hero-abilities";
import HeroLevelUp from "#/components/hero-detail/hero-level-up";
import HeroPortrait from "#/components/hero-detail/hero-portrait";
import HeroStats from "#/components/hero-detail/hero-stats";
import { fetchHeroes } from "#/server/fetchHeroes";
import type { HeroEntry } from "#/types";
import { heroSlug } from "#/utils/heroSlug";

export const Route = createFileRoute("/heroes_/$heroSlug")({
	loader: async ({ params }): Promise<HeroEntry> => {
		const heroes = await fetchHeroes();
		const entry = heroes.find(
			(candidate) => heroSlug(candidate.hero.name) === params.heroSlug,
		);
		if (!entry) throw notFound();
		return entry;
	},
	head: ({ loaderData }: { loaderData?: HeroEntry }) => {
		const hero = loaderData?.hero;

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

		const slug = heroSlug(hero.name);
		const title = `${hero.name} — Deadlock Hero Stats, Abilities & Upgrades | Deadlock Patch Comparator`;
		const description = `${hero.name}'s Deadlock stats and abilities: starting stats, leveling growth, and all ability upgrade tiers.`;

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
			<Link
				to="/heroes"
				className="rounded-xl border border-amber-500 p-2 font-bold"
			>
				Back to all heroes
			</Link>
		</main>
	),
	component: HeroDetail,
});

function HeroDetail() {
	// Annotated for the same reason as the other routes: the generated route
	// tree and `useLoaderData()` reference each other, so inference yields `any`.
	const { hero, abilities }: HeroEntry = Route.useLoaderData();

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
