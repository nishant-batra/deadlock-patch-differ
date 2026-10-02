import { TierBlock } from "#/shared/components/ability-popover";
import { CHANGED_COLOR } from "#/shared/components/ability-row/constants";
import CutFrame from "#/shared/components/cut-frame";
import Swatch from "#/shared/components/legend-swatch";
import type { Item, TierDiff } from "#/types";
import AbilityLedger from "../hero-card/ability-ledger";
import WordingLine from "../hero-card/wording-line";

/**
 * How to read the ability half of a hero card: the per-ability change list,
 * the wording line, the icon row and the popover's upgrade tiers, in the order
 * they appear. Split from the item/stat `CardLegend` above it rather than
 * folded in, so a returning reader who already knows what green/red and
 * New/Removed mean isn't shown those swatches twice - only the language unique
 * to abilities lives here.
 *
 * Swatches render the *real* `AbilityLedger`, `WordingLine` and `TierBlock`,
 * same reasoning as `CardLegend`: a drawn mock would drift the first time the
 * card or popover markup changes. Their buttons are inert here - there is no
 * popover to open.
 */

const tier = (rows: TierDiff["rows"]): TierDiff => ({ tier: 2, rows });

/** A grey square standing in for an ability icon. */
const PLACEHOLDER_ICON =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23ffffff1a'/%3E%3C/svg%3E";

const ability = (id: number, name: string) =>
	({ id, name, class_name: `legend_${id}`, image: PLACEHOLDER_ICON }) as Item;

const noop = () => {};

export default function HeroLegend() {
	return (
		<details className="mb-8 rounded-lg border border-white/10 bg-white/[0.03]">
			<summary className="cursor-pointer select-none px-4 py-3 font-bold text-sm">
				How to read hero abilities
			</summary>

			<div className="border-white/10 border-t px-4 py-4 text-sm">
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<Swatch caption="Every number that moved on an ability is listed under its name. Green or red shows better or worse, as on other cards. Rows ending in 'Scaling' mean how much the ability grows with spirit power changed. T1/T2/T3 rows are upgrade-tier bonuses, and amber there only means it moved. Click a block for the full ability">
						<AbilityLedger
							sections={[
								{
									ability: ability(1, "Ability name"),
									rows: [
										{
											id: "cooldown",
											label: "Cooldown",
											kind: "stat",
											old: 35,
											new: 30,
											negativeAttribute: true,
											postfix: "s",
										},
										{
											id: "scaling",
											label: "Damage Scaling",
											kind: "stat",
											old: 0.8,
											new: 1,
										},
									],
									tierRows: [
										{
											key: "t2.health",
											label: "T2 · Bonus Health",
											kind: "changed",
											old: 40,
											new: 60,
										},
									],
								},
							]}
							openAbility={null}
							onOpen={noop}
						/>
					</Swatch>

					<Swatch caption="Abilities whose text was only reworded are named here instead of spelled out, since most are typo fixes. Click a name to see the word-by-word diff">
						<div className="py-2">
							<WordingLine
								wording={[
									{ ability: ability(2, "First ability") },
									{ ability: ability(3, "Second ability") },
								]}
								openAbility={null}
								onOpen={noop}
							/>
						</div>
					</Swatch>

					<Swatch caption="The icon row along the bottom: an amber border means that ability changed. Click any icon, changed or not, to see its full stats and upgrade tiers">
						<div className="flex justify-center p-3">
							<CutFrame cut="sm" color={CHANGED_COLOR} className="flex size-12">
								<span className="cut-double block size-full bg-white/10" />
							</CutFrame>
						</div>
					</Swatch>

					<Swatch caption="Inside the popover, an upgrade tier that changed - amber just means something moved, not buff or nerf. The spirit icon marks a bonus that scales with a stat instead of being flat">
						<TierBlock
							tier={tier([
								{
									key: "added",
									label: "Bonus Health",
									kind: "added",
									new: 40,
								},
								{
									key: "changed",
									label: "Ability Duration",
									kind: "changed",
									old: 3,
									new: 4.5,
									scaling: "ETechPower",
								},
								{
									key: "removed",
									label: "Weapon Damage",
									kind: "removed",
									old: 15,
								},
							])}
						/>
					</Swatch>
				</div>
			</div>
		</details>
	);
}
