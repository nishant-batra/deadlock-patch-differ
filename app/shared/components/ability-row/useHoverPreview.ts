import { useRef } from "react";
import type { OpenState } from "./types";

const OPEN_DELAY = 150;
// Long enough to cross the gap between an icon and its popover.
const CLOSE_DELAY = 200;

type Timer = React.RefObject<ReturnType<typeof setTimeout> | undefined>;

const later = (timer: Timer, run: () => void, delay: number) => {
	clearTimeout(timer.current);
	timer.current = setTimeout(run, delay);
};

/**
 * A mouse opens popovers by hovering, never by clicking: hovering an icon
 * previews its popover, leaving the icon and the popover closes it again.
 * Touch taps and keyboard presses toggle a pinned popover instead.
 *
 * The handlers go on the icon's `<li>`. A popover the row renders is portalled
 * from inside it, so React bubbles its events through the `<li>` and moving
 * between icon and popover keeps it open. A popover the owner renders
 * elsewhere spreads `popoverHoverProps` instead, on the same shared timer.
 */
export function useHoverPreview({
	openAbility,
	preview,
	status,
	toggle,
	showPreview,
	closePreview,
	hoverTimer,
}: OpenState) {
	const ownTimer: Timer = useRef(undefined);
	const timer = hoverTimer ?? ownTimer;
	const pointerType = useRef("");

	const hoverProps = (index: number) => ({
		onPointerEnter: ({ pointerType }: React.PointerEvent) => {
			if (pointerType !== "mouse") return;
			// A preview that is still fading out gets reopened below.
			if (preview && openAbility === index && status === "open")
				return clearTimeout(timer.current);
			later(timer, () => showPreview(index), OPEN_DELAY);
		},
		onPointerLeave: ({ pointerType }: React.PointerEvent) => {
			if (pointerType !== "mouse") return;
			if (!preview) return clearTimeout(timer.current);
			later(timer, closePreview, CLOSE_DELAY);
		},
	});

	const iconProps = (index: number) => ({
		onPointerDown: ({ pointerType: type }: React.PointerEvent) => {
			pointerType.current = type;
		},
		// `detail` is 0 for a keyboard press, which always toggles.
		onClick: ({ detail }: React.MouseEvent) => {
			if (detail > 0 && pointerType.current === "mouse") return;
			clearTimeout(timer.current);
			toggle(index);
		},
	});

	return { hoverProps, iconProps };
}

/** For a popover rendered outside its row: on it, a preview stays open; off it, it closes. */
export function popoverHoverProps(
	timer: Timer,
	{ preview, closePreview }: Pick<OpenState, "preview" | "closePreview">,
) {
	return {
		onPointerEnter: ({ pointerType }: React.PointerEvent) => {
			if (pointerType === "mouse") clearTimeout(timer.current);
		},
		onPointerLeave: ({ pointerType }: React.PointerEvent) => {
			if (pointerType === "mouse" && preview)
				later(timer, closePreview, CLOSE_DELAY);
		},
	};
}
