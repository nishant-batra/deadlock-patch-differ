import clsx from "clsx";
import { useId } from "react";
import { createPortal } from "react-dom";
import AbilityCard from "#/shared/components/ability-card";
import AbilityHiddenChanges from "#/shared/components/ability-hidden-changes";
import type { Change, Item, TierDiff } from "#/types";
import NavHeader from "./nav-header";
import StepButtons from "./step-buttons";
import styles from "./styles.module.css";
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
	closing,
	onClosed,
	nav,
	preview,
}: {
	ability: Item;
	changes: Change[];
	tiers: TierDiff[];
	/** The button that opened this popover - positioning is measured from it. */
	anchorRef: React.RefObject<HTMLElement | null>;
	onClose: () => void;
	/** Playing its exit animation; `onClosed` fires when it ends. */
	closing: boolean;
	onClosed: () => void;
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

	// The layout effect sets the position variables before first paint.
	return createPortal(
		<div
			ref={ref}
			role="dialog"
			data-ability-popover
			data-preview={preview || undefined}
			aria-label={`${ability.name} upgrades`}
			aria-describedby={nav ? statusId : undefined}
			tabIndex={-1}
			// Only the dialog's own exit, not an animation bubbling up from inside.
			onAnimationEnd={({ target, currentTarget }) => {
				if (closing && target === currentTarget) onClosed();
			}}
			className={clsx(
				styles.popover,
				closing && styles.closing,
				"fixed top-(--popover-top,0) left-(--popover-left,0) z-40 max-sm:z-60 flex max-h-[calc(100dvh-16px)] w-[min(30rem,calc(100vw-16px))] flex-col shadow-2xl outline-none max-sm:inset-0 max-sm:max-h-none max-sm:w-full max-sm:bg-[#191917] max-sm:pt-[env(safe-area-inset-top)]",
			)}
		>
			<NavHeader nav={nav} statusId={statusId} onClose={onClose} />
			<div className="min-h-0 flex-1 overflow-auto overscroll-contain">
				<AbilityCard ability={ability} changes={changes} tiers={tiers}>
					<AbilityHiddenChanges ability={ability} changes={changes} />
				</AbilityCard>
			</div>
			{(prev || next) && <StepButtons prev={prev} next={next} />}
		</div>,
		document.body,
	);
}
