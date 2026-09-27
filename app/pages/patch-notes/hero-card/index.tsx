import AbilityRow from "#/shared/components/ability-row";
import HeroAvatar from "#/shared/components/hero-avatar";
import StatDelta from "#/shared/components/stat-delta";
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
		<article
			className="cut-double relative m-3 flex max-w-100 min-w-80 flex-col bg-[#1b1b24]"
			style={{ contentVisibility: "auto" }}
		>
			<header className="flex items-center gap-3 bg-[#2a2a36] p-2.5">
				<HeroAvatar hero={hero} className="cut-double [--cut:var(--cut-md)]" />
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
