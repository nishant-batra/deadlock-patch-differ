import AbilityRow from "#/shared/components/ability-row";
import { useOpenAbility } from "#/shared/components/ability-row/useOpenAbility";
import HeroCard from "#/shared/components/hero-card";
import StatDelta from "#/shared/components/stat-delta";
import type { ChangedHero } from "#/types";
import AbilityLedger from "./ability-ledger";
import { abilityLedger, heroStatRows } from "./utils";
import WordingLine from "./wording-line";

export default function ChangedHeroCard({
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

	// No `content-visibility: auto` here: with the router's view transitions it
	// crashes Chrome's renderer (STATUS_BREAKPOINT) on home -> hero -> back ->
	// hero.
	return (
		<HeroCard hero={hero} className="m-3 min-w-0 max-w-100">
			{isNew && (
				<div className="cut-corner bg-emerald-500/25 px-2.5 py-1 text-center font-bold text-[11px] text-emerald-200 uppercase tracking-widest">
					New hero this patch
				</div>
			)}
			<HeroCard.Header hero={hero} />

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
		</HeroCard>
	);
}
