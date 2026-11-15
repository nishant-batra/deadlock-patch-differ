import { useRef } from "react";
import type { OpenState } from "./types";

const OPEN_DELAY = 150;
// Long enough to cross the gap between an icon and its popover.
const CLOSE_DELAY = 200;

/**
 * A mouse opens popovers by hovering, never by clicking: hovering an icon
 * previews its popover, leaving the icon and the popover closes it again.
 * Touch taps and keyboard presses toggle a pinned popover instead.
 *
 * The handlers go on the icon's `<li>`: React bubbles events from the portalled
 * popover through it, so moving between icon and popover keeps it open.
 */
export function useHoverPreview({
	openAbility,
	preview,
	toggle,
	showPreview,
	closePreview,
}: OpenState) {
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const pointerType = useRef("");

	const later = (run: () => void, delay: number) => {
		clearTimeout(timer.current);
		timer.current = setTimeout(run, delay);
	};

	const hoverProps = (index: number) => ({
		onPointerEnter: ({ pointerType }: React.PointerEvent) => {
			if (pointerType !== "mouse") return;
			if (preview && openAbility === index) return clearTimeout(timer.current);
			later(() => showPreview(index), OPEN_DELAY);
		},
		onPointerLeave: ({ pointerType }: React.PointerEvent) => {
			if (pointerType !== "mouse") return;
			if (!preview) return clearTimeout(timer.current);
			later(closePreview, CLOSE_DELAY);
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
