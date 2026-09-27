import { useMemo, useState } from "react";
import CutFrame from "#/shared/components/cut-frame";
import { AMBER_BORDER } from "#/shared/components/cut-frame/constants";
import type { HeroEntry } from "#/types";
import HeroProfileCard from "./hero-profile-card";

export default function Heroes({
	heroesData,
	changedNames,
}: {
	heroesData: HeroEntry[];
	changedNames: string[];
}) {
	const [expandAll, setExpandAll] = useState(false);
	const sorted = [...heroesData].sort((a, b) =>
		a.hero.name.localeCompare(b.hero.name),
	);
	const changedSet = useMemo(() => new Set(changedNames), [changedNames]);

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
				<CutFrame color={AMBER_BORDER}>
					<button
						type="button"
						onClick={() => setExpandAll((current) => !current)}
						className="cut-corner px-3 py-1.5 font-bold"
					>
						{expandAll ? "Collapse all" : "Expand all stats"}
					</button>
				</CutFrame>
			</div>
			<div className="masonary">
				{sorted.map(({ hero, abilities }) => (
					<HeroProfileCard
						key={hero.id}
						hero={hero}
						abilities={abilities}
						expandAll={expandAll}
						isChanged={changedSet.has(hero.name)}
					/>
				))}
			</div>
		</main>
	);
}
