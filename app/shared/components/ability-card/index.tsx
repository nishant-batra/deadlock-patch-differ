import clsx from "clsx";
import AbilityTier from "#/shared/components/ability-tier";
import type { Change, Item, TierDiff } from "#/types";
import CardHeader from "./card-header";
import InfoSection from "./info-section";
import { headerChips, splitAbilityChanges } from "./utils";

/**
 * An ability drawn the way the in-game card draws it - and only what that card
 * shows - with this patch's moves marked in place: old values struck before
 * the new ones, rewritten copy diffed word by word. What moved off-card is
 * not this component's business; callers add `AbilityHiddenChanges` (patch
 * notes) or `AbilityAllStats` (hero page) as `children`.
 */
export default function AbilityCard({
	ability,
	changes,
	tiers,
	headerEnd,
	className,
	children,
}: {
	ability: Item;
	changes: Change[];
	tiers: TierDiff[];
	/** Slot at the end of the title row, e.g. a close button. */
	headerEnd?: React.ReactNode;
	className?: string;
	children?: React.ReactNode;
}) {
	const { properties = {}, tooltip_details, description } = ability;
	const { shown } = splitAbilityChanges(ability, changes);
	const sections = tooltip_details?.info_sections ?? [];

	return (
		<article
			className={clsx(
				"flex flex-col gap-4 border-[1.5px] border-[#2d4b43] bg-[#1d1d1b] px-5 pt-5 pb-5 text-[#d9d5cc]",
				className,
			)}
		>
			<CardHeader
				ability={ability}
				chips={headerChips(ability)}
				previous={shown.previous}
				end={headerEnd}
			/>
			{sections.map((section, index) => (
				<InfoSection
					// biome-ignore lint/suspicious/noArrayIndexKey: sections have no id and never reorder
					key={index}
					section={section}
					properties={properties}
					textChange={shown.text.get(index)}
					shown={shown}
				/>
			))}
			{tiers.length > 0 && (
				<div className="mt-1 grid grid-cols-3 gap-2">
					{tiers.map((tier) => (
						<AbilityTier
							key={tier.tier}
							tier={tier}
							desc={description?.[`t${tier.tier}_desc`]}
						/>
					))}
				</div>
			)}
			{children}
		</article>
	);
}
