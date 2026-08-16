import { createPortal } from "react-dom";
import type { Change, Item, TierDiff } from "#/types";
import { prose } from "#/utils/tooltipProjection";
import AbilityDetail from "./ability-detail";
import TierBlock from "./tier-block";
import { useDismissablePopover } from "./useDismissablePopover";

export default function AbilityPopover({
	ability,
	changes,
	tiers,
	anchorRef,
	onClose,
}: {
	ability: Item;
	changes: Change[];
	tiers: TierDiff[];
	/** The button that opened this popover - positioning is measured from it. */
	anchorRef: React.RefObject<HTMLElement | null>;
	onClose: () => void;
}) {
	const { ref, style } = useDismissablePopover(anchorRef, onClose);

	// Anything that is not an upgrade or tier-description move - property values,
	// tooltip details. Those are rendered by AbilityDetail below the tiers.
	const otherChanges = changes.filter(
		(change) =>
			change.path[0] !== "upgrades" &&
			!(change.path[0] === "description" && /^t\d_desc$/.test(change.path[1])),
	);

	return createPortal(
		<div
			ref={ref}
			role="dialog"
			aria-label={`${ability.name} upgrades`}
			style={style ?? { position: "fixed", top: -9999, left: -9999 }}
			className="z-1 overflow-auto   max-h-[calc(100dvh-16px)] max-w-100 min-w-80 rounded-lg border border-white/15 bg-[#15151d] p-3 shadow-2xl"
		>
			<div className="flex items-start justify-between gap-2">
				<p className="font-bold">{ability.name}</p>
				<button
					type="button"
					onClick={onClose}
					aria-label="Close"
					className="-mt-1 px-1 text-gray-400 text-lg leading-none hover:text-white"
				>
					&times;
				</button>
			</div>
			{ability.description?.desc && (
				<p className="mt-0.5 text-gray-400 text-xs">
					{prose(ability.description.desc)}
				</p>
			)}

			<div className="mt-3 flex flex-col gap-1.5">
				{tiers.map((tier) => (
					<TierBlock key={tier.tier} tier={tier} />
				))}
			</div>

			{otherChanges.length > 0 && (
				<div className="mt-2">
					<AbilityDetail item={ability} changes={otherChanges} />
				</div>
			)}
		</div>,
		document.body,
	);
}
