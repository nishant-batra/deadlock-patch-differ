import { createPortal } from "react-dom";
import AbilityCard from "#/shared/components/ability-card";
import AbilityHiddenChanges from "#/shared/components/ability-hidden-changes";
import type { Change, Item, TierDiff } from "#/types";
import { useDismissablePopover } from "./useDismissablePopover";

/**
 * The patch-notes view of one ability: the in-game card with this patch's
 * moves marked on it, plus whatever moved off-card. No "All stats" here - a
 * patch note is about what changed, not a full reference.
 */
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

	return createPortal(
		<div
			ref={ref}
			role="dialog"
			aria-label={`${ability.name} upgrades`}
			style={style ?? { position: "fixed", top: -9999, left: -9999 }}
			className="z-40 max-h-[calc(100dvh-16px)] w-[min(30rem,calc(100vw-16px))] overflow-auto shadow-2xl"
		>
			<AbilityCard
				ability={ability}
				changes={changes}
				tiers={tiers}
				headerEnd={
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="-mt-1 px-1 text-gray-400 text-xl leading-none hover:text-white"
					>
						&times;
					</button>
				}
			>
				<AbilityHiddenChanges ability={ability} changes={changes} />
			</AbilityCard>
		</div>,
		document.body,
	);
}
