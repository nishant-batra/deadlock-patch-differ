import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { HeroEntry } from "#/types";
import HeroProfileCard from "./hero-profile-card";

export default function Heroes({ heroesData }: { heroesData: HeroEntry[] }) {
	const [expandAll, setExpandAll] = useState(false);
	const sorted = [...heroesData].sort((a, b) =>
		a.hero.name.localeCompare(b.hero.name),
	);

	return (
		<main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
			<h1 className="mb-1 font-extrabold text-2xl">All Deadlock Heroes</h1>
			<p className="mb-6 text-gray-400 text-sm">
				Explore hero stats for every Deadlock hero — starting stats, leveling
				growth, weapons, and ability upgrade tiers.
			</p>
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
