import AbilityRow from "#/shared/components/ability-row";
import { useOpenAbility } from "#/shared/components/ability-row/useOpenAbility";
import HeroAvatar from "#/shared/components/hero-avatar";
import StatDelta from "#/shared/components/stat-delta";
import type { ChangedHero } from "#/types";
import AbilityLedger from "./ability-ledger";
import { abilityLedger, heroStatRows } from "./utils";
import WordingLine from "./wording-line";

export default function HeroCard({
	hero,
	abilities,
	statChanges,
	weaponChanges,
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
