import { useState } from "react";
import type { ChangedHero } from "#/types";
import AbilityDetail from "./AbilityDetail";
import { labelForStatKey } from "./constants";
import StatDelta, { deltaRowsFromChanges } from "./StatDelta";

/**
 * Finding #1: a hero stat move lands in `starting_stats` OR
 * `standard_level_up_upgrades`. `statChanges` is already flattened by
 * `summarize()`, so the path tells us which and no field list is hardcoded.
 *   ['starting_stats','max_health','value']                 -> Max Health
 *   ['standard_level_up_upgrades','MODIFIER_VALUE_…']       -> Bullet Damage / Level
 */
const labelForStat = (path: string[]) =>
	labelForStatKey(
		path.at(-1) === "value" && path.length > 1
			? (path.at(-2) as string)
			: (path.at(-1) as string),
	);

export default function HeroCard({
	hero,
	abilities,
	statChanges,
}: ChangedHero) {
	const [open, setOpen] = useState<string | null>(null);
	const openAbility = abilities.find((a) => a.ability.class_name === open);

	return (
		<article className="m-3 flex w-100 flex-col overflow-hidden rounded-md bg-[#1b1b24]">
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

			{statChanges.length > 0 && (
				<div className="flex flex-col bg-[#22222c] py-1">
					{deltaRowsFromChanges(statChanges, undefined, (change) =>
						labelForStat(change.path),
					).map((row) => (
						<StatDelta key={row.id} row={row} />
					))}
				</div>
			)}

			<ul className="flex list-none gap-2 p-2.5">
				{abilities.map(({ ability, changes }) => {
					const isOpen = open === ability.class_name;
					return (
						<li key={ability.id} className="relative">
							<button
								type="button"
								aria-expanded={isOpen}
								title={ability.name}
								onClick={() =>
									setOpen((current) =>
										current === ability.class_name ? null : ability.class_name,
									)
								}
								className={`relative block rounded p-0.5 ${isOpen ? "ring-2 ring-white" : "ring-1 ring-white/15"}`}
							>
								<img
									src={ability.image_webp ?? ability.image}
									alt={ability.name}
									width={44}
									height={44}
								/>
								{changes.length > 0 && (
									<span className="absolute -top-1 -right-1 block size-2.5 rounded-full bg-amber-300">
										<span className="sr-only">
											{changes.length} change{changes.length === 1 ? "" : "s"}
										</span>
									</span>
								)}
							</button>
						</li>
					);
				})}
			</ul>

			{openAbility && (
				<div className="px-2.5 pb-2.5">
					<p className="font-bold">{openAbility.ability.name}</p>
					<AbilityDetail
						item={openAbility.ability}
						changes={openAbility.changes}
					/>
				</div>
			)}
		</article>
	);
}
