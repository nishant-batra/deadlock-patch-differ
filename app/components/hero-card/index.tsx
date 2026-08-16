import AbilityRow from "#/components/ability-row";
import StatDelta from "#/components/stat-delta";
import type { ChangedHero } from "#/types";
import { heroStatRows } from "./utils";

export default function HeroCard({
	hero,
	abilities,
	statChanges,
	weaponChanges,
}: ChangedHero) {
	const statRows = heroStatRows(statChanges, weaponChanges);

	return (
		<article className="m-3 flex max-w-100 min-w-80 flex-col rounded-md bg-[#1b1b24] relative">
			<header className="flex items-center gap-3 bg-[#2a2a36] p-2.5">
				{/* Not a <picture>: a 404 on the webp <source> would not fall back,
				    and at least one hero (Boho) is missing its webp upstream. */}
				<img
					src={hero.images?.icon_hero_card_webp ?? hero.images?.icon_hero_card}
					onError={(event) => {
						const img = event.currentTarget;
						const png = hero.images?.icon_hero_card;
						if (png && img.src !== png) img.src = png;
					}}
					alt={hero.name}
					width={44}
					height={44}
					className="rounded"
				/>
				<h3 className="font-extrabold text-lg">{hero.name}</h3>
			</header>

			{statRows.length > 0 && (
				<div className="flex flex-col bg-[#22222c] py-1">
					{statRows.map((row) => (
						<StatDelta key={row.id} row={row} />
					))}
				</div>
			)}

			<AbilityRow abilities={abilities} />
		</article>
	);
}
