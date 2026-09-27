import { TierBlock } from "#/shared/components/ability-popover";
import { CHANGED_COLOR } from "#/shared/components/ability-row/constants";
import CutFrame from "#/shared/components/cut-frame";
import Swatch from "#/shared/components/legend-swatch";
import type { TierDiff } from "#/types";

/**
 * How to read a hero card's ability row. Split from the item/stat `CardLegend`
 * above it rather than folded in, so a returning reader who already knows
 * what green/red and New/Removed mean isn't shown those swatches twice -
 * only the language unique to abilities lives here.
 *
 * The tier swatch renders the *real* `TierBlock`, same reasoning as `CardLegend`:
 * a drawn mock would drift the first time the ability popover's markup
 * changes.
 */

const tier = (rows: TierDiff["rows"]): TierDiff => ({ tier: 2, rows });

export default function HeroLegend() {
	return (
		<details className="mb-8 rounded-lg border border-white/10 bg-white/[0.03]">
			<summary className="cursor-pointer select-none px-4 py-3 font-bold text-sm">
				How to read hero abilities
			</summary>

			<div className="border-white/10 border-t px-4 py-4 text-sm">
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<Swatch caption="An ability icon with an amber border changed this patch - click it to open its upgrade tiers">
						<div className="flex justify-center p-3">
							<CutFrame cut="sm" color={CHANGED_COLOR} className="flex size-12">
								<span className="cut-double block size-full bg-white/10" />
							</CutFrame>
						</div>
					</Swatch>

					<Swatch caption="An upgrade tier that changed - amber just means something moved, not buff or nerf. The spirit icon marks a bonus that scales with a stat instead of being flat">
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
