import { useId, ViewTransition } from "react";
import { createPortal } from "react-dom";
import AbilityCard from "#/shared/components/ability-card";
import AbilityHiddenChanges from "#/shared/components/ability-hidden-changes";
import type { Change, Item, TierDiff } from "#/types";
import NavHeader from "./nav-header";
import StepButtons from "./step-buttons";
import type { PopoverNav } from "./types";
import { useDismissablePopover } from "./useDismissablePopover";

/**
 * The patch-notes view of one ability: the in-game card with this patch's
 * moves marked on it, plus whatever moved off-card. No "All stats" here - a
 * patch note is about what changed, not a full reference. Anchored to its icon
 * on wider screens; full screen on phones.
 */
export default function AbilityPopover({
	ability,
	changes,
	tiers,
	anchorRef,
	onClose,
	nav,
	preview,
}: {
	ability: Item;
	changes: Change[];
	tiers: TierDiff[];
	/** The button that opened this popover - positioning is measured from it. */
	anchorRef: React.RefObject<HTMLElement | null>;
	onClose: () => void;
	/** Moving between changed abilities; omitted for an unchanged one. */
	nav?: PopoverNav;
	/** Opened by hovering its icon, not yet pinned by a click. */
	preview?: boolean;
}) {
	const { prev, next } = nav ?? {};
	const ref = useDismissablePopover({
		anchorRef,
		onClose,
		onPrev: prev?.go,
		onNext: next?.go,
	});
	const statusId = useId();

	// Until the layout effect sets the position variables, the `0` fallbacks
	// park the dialog at the viewport's corner rather than off-screen: React
	// skips the enter animation for elements outside the viewport, and it
	// measures before layout effects run. The layout effect still moves it
	// into place before paint. The fixed name makes a step (one icon's popover
	// closing, the next one's opening) animate as one popover whose content
	// changes - not an exit plus an enter. Open/close animations: app.css.
	// shortcut: assumes one popover open per page; two at once would clash names.
	return createPortal(
		<ViewTransition
			name="ability-popover"
			enter="ability-popover-in"
			exit="ability-popover-out"
		>
			<div
				ref={ref}
				role="dialog"
				data-ability-popover
				data-preview={preview || undefined}
				aria-label={`${ability.name} upgrades`}
				aria-describedby={nav ? statusId : undefined}
				tabIndex={-1}
				className="fixed top-(--popover-top,0) left-(--popover-left,0) z-40 max-sm:z-60 flex max-h-[calc(100dvh-16px)] w-[min(30rem,calc(100vw-16px))] flex-col shadow-2xl outline-none max-sm:inset-0 max-sm:max-h-none max-sm:w-full max-sm:bg-[#191917] max-sm:pt-[env(safe-area-inset-top)]"
			>
				<NavHeader nav={nav} statusId={statusId} onClose={onClose} />
				<div className="min-h-0 flex-1 overflow-auto overscroll-contain">
					<AbilityCard ability={ability} changes={changes} tiers={tiers}>
						<AbilityHiddenChanges ability={ability} changes={changes} />
					</AbilityCard>
				</div>
				{(prev || next) && <StepButtons prev={prev} next={next} />}
			</div>
		</ViewTransition>,
		document.body,
	);
}
