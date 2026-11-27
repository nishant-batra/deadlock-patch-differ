import { useLayoutEffect, useRef } from "react";

const MARGIN = 8;

/** Pins the dialog beside its anchor, flipping above it when there's no room below. */
function placeDialog(anchor: HTMLElement | null, dialog: HTMLElement | null) {
	if (!anchor || !dialog) return;
	const anchorBox = anchor.getBoundingClientRect();
	const width = dialog.offsetWidth;
	const height = dialog.offsetHeight;

	let left = anchorBox.left;
	left = Math.min(left, window.innerWidth - width - MARGIN);
	left = Math.max(left, MARGIN);

	const spaceBelow = window.innerHeight - anchorBox.bottom;
	const opensAbove = height > 0 && spaceBelow < height + MARGIN;
	let top = opensAbove
		? anchorBox.top - height - MARGIN
		: anchorBox.bottom + MARGIN;
	top = Math.max(top, MARGIN);

	dialog.style.setProperty("--popover-top", `${top}px`);
	dialog.style.setProperty("--popover-left", `${left}px`);
}

/**
 * Positions the dialog with `position: fixed`, measured from `anchorRef`
 * (the button that opened it) rather than the dialog's own place in the DOM.
 *
 * Previously this returned `{ ref, flip }` for an `absolute` dialog nested
 * inside the card's `relative <li>`. That dialog was still a descendant of
 * `.masonary`, a CSS multi-column container - browsers fragment abspos
 * descendants of a multicol box and re-run column balancing around them, so
 * opening a popover visibly shifted every card below it in that column
 * (measured: a 210px jump one column over). Rendering through a portal at
 * `document.body` removes the dialog from that box entirely; `fixed`
 * positioning removes it from page flow, so it can no longer add scroll
 * height or push anything else. Recomputed on scroll/resize so it stays
 * pinned to the anchor.
 *
 * The position is written straight onto the dialog as `--popover-top` /
 * `--popover-left` (read by its `top-(…)` / `left-(…)` classes), not kept in
 * React state, so scrolling does not re-render the whole card.
 *
 * One dialog can move between anchors (prev/next on the patch-notes page keeps
 * it mounted): `anchorKey` names the current one, and changing it re-places.
 */
export function useDismissablePopover({
	anchorRef,
	anchorKey,
	onClose,
	onPrev,
	onNext,
}: {
	anchorRef: React.RefObject<HTMLElement | null>;
	anchorKey: string | number;
	onClose: () => void;
	onPrev?: () => void;
	onNext?: () => void;
}) {
	const ref = useRef<HTMLDivElement>(null);

	// Read via refs rather than depending on these directly: their identity can
	// change every render (`anchorRefFor` builds a new wrapper each time), which
	// would re-run the effects below - and re-register listeners - every render.
	const anchorRefRef = useRef(anchorRef);
	anchorRefRef.current = anchorRef;
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;
	const stepRef = useRef({ onPrev, onNext });
	stepRef.current = { onPrev, onNext };

	// Each new anchor: on open, and on each prev/next step.
	// biome-ignore lint/correctness/useExhaustiveDependencies: `anchorKey` stands in for the anchor, read through a ref
	useLayoutEffect(() => {
		const anchor = anchorRefRef.current.current;
		// Prev/next can open an ability on another hero's card, possibly off
		// screen: bring its icon into view first. No-op for a clicked icon.
		anchor?.scrollIntoView({ block: "nearest" });
		// Layout effects run after commit but before paint, so the real
		// `offsetHeight` is already there - no flash of the wrong position.
		placeDialog(anchor, ref.current);
		// Keyboard and screen-reader users land in the dialog, including after
		// prev/next swaps its content.
		ref.current?.focus({ preventScroll: true });
	}, [anchorKey]);

	useLayoutEffect(() => {
		const place = () => placeDialog(anchorRefRef.current.current, ref.current);
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") onCloseRef.current();
			// A/D step like the arrows; not with a modifier (Ctrl+D bookmarks).
			if (event.ctrlKey || event.metaKey || event.altKey) return;
			// Typing elsewhere on the page is not stepping.
			if (
				(event.target as Element).closest("input, textarea, [contenteditable]")
			)
				return;
			const key = event.key.toLowerCase();
			if (key === "arrowleft" || key === "a") stepRef.current.onPrev?.();
			if (key === "arrowright" || key === "d") stepRef.current.onNext?.();
		};
		// A press on the icon is left to the icon itself.
		const onPointer = ({ target }: MouseEvent) => {
			const inside = [ref.current, anchorRefRef.current.current].some((node) =>
				node?.contains(target as Node),
			);
			if (!inside) onCloseRef.current();
		};
		document.addEventListener("keydown", onKey);
		// Deferred: the click that opened the popover is still propagating.
		const timeoutId = setTimeout(
			() => document.addEventListener("mousedown", onPointer),
			0,
		);
		window.addEventListener("scroll", place, { capture: true, passive: true });
		window.addEventListener("resize", place);

		const dialog = ref.current;
		return () => {
			// Hand focus back to the icon if it was in the dialog (or dropped to
			// <body>), not if the user already moved it elsewhere.
			const active = document.activeElement;
			if (!active || active === document.body || dialog?.contains(active)) {
				anchorRefRef.current.current?.focus({ preventScroll: true });
			}
			document.removeEventListener("keydown", onKey);
			document.removeEventListener("mousedown", onPointer);
			clearTimeout(timeoutId);
			window.removeEventListener("scroll", place, { capture: true });
			window.removeEventListener("resize", place);
		};
	}, []);

	return ref;
}
