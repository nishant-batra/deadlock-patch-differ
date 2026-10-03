import { Link } from "@tanstack/react-router";
import AbilityRow from "#/shared/components/ability-row";
import { useOpenAbility } from "#/shared/components/ability-row/useOpenAbility";
import HeroAvatar from "#/shared/components/hero-avatar";
import StatDelta from "#/shared/components/stat-delta";
import { heroSlug } from "#/shared/utils/heroSlug";
import type { ChangedHero } from "#/types";
import AbilityLedger from "./ability-ledger";
import { abilityLedger, heroStatRows } from "./utils";
import WordingLine from "./wording-line";

export default function HeroCard({
	hero,
	abilities,
	statChanges,
	weaponChanges,
	isNew,
}: ChangedHero) {
	const statRows = heroStatRows(statChanges, weaponChanges);
	const { sections, wording } = abilityLedger(abilities);
	const openState = useOpenAbility();
	const { openAbility, toggleAbility } = openState;

	return (
		<article
			className="cut-double relative m-3 flex max-w-100 min-w-0 flex-col bg-[#1b1b24]"
			style={{ contentVisibility: "auto" }}
		>
			{isNew && (
				<div className="cut-corner bg-emerald-500/25 px-2.5 py-1 text-center font-bold text-[11px] text-emerald-200 uppercase tracking-widest">
					New hero this patch
				</div>
			)}
			<header className="bg-[#2a2a36] p-2.5">
				<Link
					to="/heroes/$heroSlug"
					params={{ heroSlug: heroSlug(hero.name) }}
					className="group flex items-center gap-3"
				>
					<HeroAvatar
						hero={hero}
						className="cut-double [--cut:var(--cut-md)]"
					/>
					<h3 className="font-extrabold text-lg group-hover:underline">
						{hero.name}
					</h3>
				</Link>
			</header>

			{statRows.length > 0 && (
				<div className="flex flex-col bg-[#22222c] py-1">
					{statRows.map((row) => (
						<StatDelta key={row.id} row={row} />
					))}
				</div>
			)}

			<AbilityLedger
				sections={sections}
				openAbility={openAbility}
				onOpen={toggleAbility}
			/>
			<WordingLine
				wording={wording}
				openAbility={openAbility}
				onOpen={toggleAbility}
			/>

			<AbilityRow abilities={abilities} openState={openState} />
		</article>
	);
}
