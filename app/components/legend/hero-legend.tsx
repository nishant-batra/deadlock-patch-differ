import TierBlock from "#/components/ability-popover/tier-block";
import type { TierDiff } from "#/types";
import Swatch from "./swatch";

/**
 * How to read a hero card's ability row. Split from the item/stat `Legend`
 * above it rather than folded in, so a returning reader who already knows
 * what green/red and New/Removed mean isn't shown those swatches twice -
 * only the language unique to abilities lives here.
 *
 * The tier swatch renders the *real* `TierBlock`, same reasoning as `Legend`:
 * a drawn mock would drift the first time the ability popover's markup
 * changes.
 */

const tier = (rows: TierDiff["rows"]): TierDiff => ({ tier: 2, rows });

export default function HeroLegend() {
	return (
		<details
			open
			className="mb-8 rounded-lg border border-white/10 bg-white/[0.03]"
		>
			<summary className="cursor-pointer select-none px-4 py-3 font-bold text-sm">
				How to read hero abilities
			</summary>

			<div className="border-white/10 border-t px-4 py-4 text-sm">
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<Swatch caption="An ability icon with a dot changed this patch - click it to open its upgrade tiers">
						<div className="flex justify-center p-3">
							<span className="relative block size-11 rounded bg-white/10 ring-1 ring-white/15">
								<span className="absolute -top-1 -right-1 block size-2.5 rounded-full bg-amber-300">
									<span className="sr-only">Changed this patch</span>
								</span>
							</span>
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
