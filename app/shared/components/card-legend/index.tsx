import CutFrame from "#/shared/components/cut-frame";
import { colorsFor } from "#/shared/components/item-card/constants";
import LegendSwatch from "#/shared/components/legend-swatch";
import PropertyList from "#/shared/components/property-list";
import StatDelta, { type DeltaRow } from "#/shared/components/stat-delta";
import { ItemSlotType } from "#/types";

/**
 * How to read a change card. Where a swatch can render the *real* component
 * (`StatDelta`, `PropertyList`) it does, so the legend can't drift from what
 * the cards show. The card frame and change strip are small replicas - a
 * real `ItemCard` is far too big for a swatch - so they mirror its markup and
 * must be kept in step with it.
 *
 * A <details>, collapsed by default - a returning reader who already knows the
 * colour language (green/red is direction, not magnitude) shouldn't have to
 * scroll past it every visit; it's one click away for anyone who needs it.
 *
 * No prose intro or trailing notes - the visuals plus captions carry the
 * meaning on their own, and duplicating that in a paragraph just gave readers
 * two versions of the same explanation to reconcile.
 *
 * Hero abilities have their own change language (upgrade tiers, scaling icons)
 * not covered here - see `HeroLegend` on the patch-notes page.
 */

const example = (row: Omit<DeltaRow, "id">): DeltaRow => ({
	id: "legend",
	...row,
});

const colors = colorsFor(ItemSlotType.WEAPON);

const chipProperties = {
	BonusFireRate: {
		value: "25",
		postfix: "%",
		label: "Fire Rate",
		tooltip_is_important: true,
		tooltip_section: "passive",
	},
	AbilityDuration: {
		value: "15",
		postfix: "s",
		label: "Duration",
		tooltip_is_important: true,
		tooltip_section: "passive",
	},
};

export default function CardLegend() {
	return (
		<details className="mb-8 rounded-lg border border-white/10 bg-white/[0.03]">
			<summary className="cursor-pointer select-none px-4 py-3 font-bold text-sm">
				How to read these cards
			</summary>

			<div className="border-white/10 border-t px-4 py-4 text-sm">
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<LegendSwatch caption="A card with a border changed this patch. Items added or removed this patch get a green or red bar instead">
						<div className="flex justify-center p-3">
							<CutFrame
								cut="md"
								width={2}
								color={colors.primary}
								className="flex w-44"
							>
								<div
									className="cut-double flex-1 overflow-hidden"
									style={{ background: colors.description }}
								>
									<div className="cut-corner bg-amber-500/25 px-2 py-0.5 text-center font-bold text-[10px] text-amber-200 uppercase tracking-widest">
										Changed this patch
									</div>
									<div
										className="flex flex-col px-2 py-1 text-xs"
										style={{ background: colors.primary }}
									>
										<span className="font-extrabold">Item name</span>
										<span className="font-medium text-green-200">3200</span>
									</div>
									<div className="h-8" />
								</div>
							</CutFrame>
						</div>
					</LegendSwatch>

					<LegendSwatch caption="A stat with a border changed: the old value is struck through, and the new one is coloured by whether it got better or worse">
						<div className="p-2" style={{ background: colors.description }}>
							<PropertyList
								allProperties={chipProperties}
								itemProperties={Object.keys(chipProperties)}
								background={colors.highlight}
								fontColor={colors.primary}
								changedFrameColor={colors.primary}
								previousValues={new Map([["BonusFireRate", "20%"]])}
								className="gap-1"
							/>
						</div>
					</LegendSwatch>

					<LegendSwatch caption="Changes with no stat on the card (cost, cooldown, reworded text, added or removed lines) are listed under the item image">
						<div className="py-2" style={{ background: colors.description }}>
							<div
								className="mx-2 flex flex-col border-l-2 py-1"
								style={{
									background: colors.highlight,
									borderLeftColor: colors.primary,
								}}
							>
								<StatDelta
									row={example({
										label: "Cost",
										kind: "stat",
										old: 3000,
										new: 3200,
										negativeAttribute: true,
									})}
								/>
							</div>
						</div>
					</LegendSwatch>

					<LegendSwatch caption="Green is better, red is worse. The colour shows direction, not size">
						<StatDelta
							row={example({
								label: "Weapon Damage",
								kind: "stat",
								old: 12,
								new: 18,
							})}
						/>
						<StatDelta
							row={example({
								label: "Spirit Power",
								kind: "stat",
								old: 8,
								new: 6,
							})}
						/>
					</LegendSwatch>

					<LegendSwatch caption="Cooldown — longer is a nerf, so it reads red">
						<StatDelta
							row={example({
								label: "Cooldown",
								kind: "stat",
								old: 35,
								new: 37,
								negativeAttribute: true,
							})}
						/>
					</LegendSwatch>

					<LegendSwatch caption="A stat line was added or removed">
						<StatDelta
							row={example({
								label: "Bullet Lifesteal",
								kind: "added",
								new: 10,
							})}
						/>
						<StatDelta
							row={example({
								label: "Debuff Resist",
								kind: "removed",
								old: 17,
							})}
						/>
					</LegendSwatch>

					<LegendSwatch caption="A reworded description — struck words left, bright words are new">
						<p className="px-2 py-1 leading-relaxed">
							<span className="text-gray-400">Grants Fire Rate </span>
							<s className="text-gray-500">and</s>
							<span className="font-medium text-gray-100">, Spirit Resist</span>
							<span className="text-gray-400"> but Silences you.</span>
						</p>
					</LegendSwatch>
				</div>
			</div>
		</details>
	);
}
