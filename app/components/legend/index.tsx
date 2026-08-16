import StatDelta, { type DeltaRow } from "#/components/stat-delta";
import Swatch from "./swatch";

/**
 * How to read a change card. The swatches render the *real* `StatDelta` and the
 * *real* description-diff markup, not a drawn mock, so the legend can never
 * drift from what the cards actually show - if the rendering changes, this
 * changes with it.
 *
 * A <details> so returning readers can fold it away; open by default because the
 * colour language (green/red is direction, not magnitude) is not obvious.
 *
 * No prose intro or trailing notes - the visuals plus captions carry the
 * meaning on their own, and duplicating that in a paragraph just gave readers
 * two versions of the same explanation to reconcile.
 *
 * Hero abilities have their own change language (upgrade tiers, scaling icons)
 * not covered here - see `HeroLegend`.
 */

const example = (row: Omit<DeltaRow, "id">): DeltaRow => ({
	id: "legend",
	...row,
});

export default function Legend() {
	return (
		<details
			open
			className="mb-8 rounded-lg border border-white/10 bg-white/[0.03]"
		>
			<summary className="cursor-pointer select-none px-4 py-3 font-bold text-sm">
				How to read these cards
			</summary>

			<div className="border-white/10 border-t px-4 py-4 text-sm">
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<Swatch caption="A stat improved (here, higher is better)">
						<StatDelta
							row={example({
								label: "Weapon Damage",
								kind: "stat",
								old: 12,
								new: 18,
							})}
						/>
					</Swatch>

					<Swatch caption="A stat got worse">
						<StatDelta
							row={example({
								label: "Spirit Power",
								kind: "stat",
								old: 8,
								new: 6,
							})}
						/>
					</Swatch>

					<Swatch caption="Cooldown — longer is a nerf, so it reads red">
						<StatDelta
							row={example({
								label: "Cooldown",
								kind: "stat",
								old: 35,
								new: 37,
								negativeAttribute: true,
							})}
						/>
					</Swatch>

					<Swatch caption="A new stat line was added">
						<StatDelta
							row={example({
								label: "Bullet Lifesteal",
								kind: "added",
								new: 10,
							})}
						/>
					</Swatch>

					<Swatch caption="A stat line was removed">
						<StatDelta
							row={example({
								label: "Debuff Resist",
								kind: "removed",
								old: 17,
							})}
						/>
					</Swatch>

					<Swatch caption="A reworded description — struck words left, bright words are new">
						<p className="px-2 py-1 leading-relaxed">
							<span className="text-gray-400">Grants Fire Rate </span>
							<s className="text-gray-500">and</s>
							<span className="font-medium text-gray-100">, Spirit Resist</span>
							<span className="text-gray-400"> but Silences you.</span>
						</p>
					</Swatch>
				</div>
			</div>
		</details>
	);
}
