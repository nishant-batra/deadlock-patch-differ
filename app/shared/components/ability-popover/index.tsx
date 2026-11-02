import { ViewTransition } from "react";
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
	onPrev,
	onNext,
}: {
	ability: Item;
	changes: Change[];
	tiers: TierDiff[];
	/** The button that opened this popover - positioning is measured from it. */
	anchorRef: React.RefObject<HTMLElement | null>;
	onClose: () => void;
	/** Open the hero's previous / next changed ability; omitted at either end. */
	onPrev?: () => void;
	onNext?: () => void;
}) {
	const ref = useDismissablePopover(anchorRef, onClose, onPrev, onNext);
	const arrowClass = "-mt-1 px-1 text-gray-400 text-xl leading-none hover:text-white";

	// Until the layout effect sets the position variables, the `0` fallbacks
	// park the dialog at the viewport's corner rather than off-screen: React
	// skips the enter animation for elements outside the viewport, and it
	// measures before layout effects run. The layout effect still moves it
	// into place before paint.
	return createPortal(
		<ViewTransition>
			<div
				ref={ref}
				role="dialog"
				aria-label={`${ability.name} upgrades`}
				className="fixed top-(--popover-top,0) left-(--popover-left,0) z-40 max-h-[calc(100dvh-16px)] w-[min(30rem,calc(100vw-16px))] overflow-auto shadow-2xl"
			>
				<AbilityCard
					ability={ability}
					changes={changes}
					tiers={tiers}
					headerEnd={
						<div className="flex">
							{onPrev && (
								<button
									type="button"
									onClick={onPrev}
									aria-label="Previous changed ability"
									className={arrowClass}
								>
									&lsaquo;
								</button>
							)}
							{onNext && (
								<button
									type="button"
									onClick={onNext}
									aria-label="Next changed ability"
									className={arrowClass}
								>
									&rsaquo;
								</button>
							)}
							<button
								type="button"
								onClick={onClose}
								aria-label="Close"
								className={arrowClass}
							>
								&times;
							</button>
						</div>
					}
				>
					<AbilityHiddenChanges ability={ability} changes={changes} />
				</AbilityCard>
			</div>
		</ViewTransition>,
		document.body,
	);
}
