import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import HeroProfileCard from "#/components/hero-profile-card";
import { fetchHeroes } from "#/server/fetchHeroes";
import type { HeroEntry } from "#/types";

export const Route = createFileRoute("/heroes")({
	head: ({ loaderData }: { loaderData?: HeroEntry[] }) => {
		const heroCount = loaderData?.length ?? 0;
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
				{ property: "og:url", content: "https://deadlock-patch-differ.vercel.app/heroes" },
				{ name: "twitter:title", content: title },
				{ name: "twitter:description", content: description },
			],
			links: [{ rel: "canonical", href: "https://deadlock-patch-differ.vercel.app/heroes" }],
		};
	},
	loader: async () => fetchHeroes(),
	component: Heroes,
});

function Heroes() {
	// Annotated for the same reason as the other routes: the generated route
	// tree and `useLoaderData()` reference each other, so inference yields `any`.
	const heroesData: HeroEntry[] = Route.useLoaderData();
	const [expandAll, setExpandAll] = useState(false);
	const sorted = [...heroesData].sort((a, b) =>
		a.hero.name.localeCompare(b.hero.name),
	);

	return (
		<main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
			<div className="mb-4 flex items-center justify-between">
				<p className="text-gray-400 text-sm">
					{sorted.length} live hero{sorted.length === 1 ? "" : "es"}
				</p>
				<div className="flex gap-2">
					<Link
						to="/compare"
						search={{ heroes: [] }}
						className="rounded-xl border border-amber-500 p-2 font-bold"
					>
						Compare heroes
					</Link>
					<button
						type="button"
						onClick={() => setExpandAll((current) => !current)}
						className="rounded-xl border border-amber-500 p-2 font-bold"
					>
						{expandAll ? "Collapse all" : "Expand all stats"}
					</button>
				</div>
			</div>
			<div className="masonary">
				{sorted.map(({ hero, abilities }) => (
					<HeroProfileCard
						key={hero.id}
						hero={hero}
						abilities={abilities}
						expandAll={expandAll}
					/>
				))}
			</div>
		</main>
	);
}
