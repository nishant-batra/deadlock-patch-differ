import { useLayoutEffect, useRef } from "react";

const MARGIN = 8;

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
 */
export function useDismissablePopover({
	anchorRef,
	onClose,
	onPrev,
	onNext,
}: {
	anchorRef: React.RefObject<HTMLElement | null>;
	onClose: () => void;
	onPrev?: () => void;
	onNext?: () => void;
}) {
	const ref = useRef<HTMLDivElement>(null);

	// Read via a ref rather than depending on the callbacks directly: their
	// identity can change every render,
	// which would otherwise re-run this effect - and re-register its listeners -
	// on every render regardless of what React Compiler decides to memoize.
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;
	const stepRef = useRef({ onPrev, onNext });
	stepRef.current = { onPrev, onNext };

	// `place()` reads `anchorRef.current` and `onCloseRef.current` fresh on
	// every call rather than capturing them, so this is correctly mount-only
	// despite the lint - re-running per render would just re-attach the same
	// listeners (harmless), but `anchorRefFor` (in useAnchorRefs.ts) returns a
	// new wrapper object every render, which would make this effect fire on
	// every render if `anchorRef` were a dependency.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useLayoutEffect(() => {
		const place = () => {
			const anchor = anchorRef.current;
			const dialog = ref.current;
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
		};

		// Prev/next can open an ability on another hero's card, possibly off
		// screen: bring its icon into view first. No-op for a clicked icon.
		anchorRef.current?.scrollIntoView({ block: "nearest" });

		// useLayoutEffect runs after the dialog is committed to the DOM but
		// before the browser paints, so its real `offsetHeight` is already
		// available here - no flash of the wrong position on open.
		place();

		// Keyboard and screen-reader users land in the dialog, including after
		// prev/next swaps it for another one.
		ref.current?.focus({ preventScroll: true });

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
			const inside = [ref.current, anchorRef.current].some((node) =>
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
			// <body>), not if the user already moved it elsewhere. On prev/next
			// the next dialog's effect then takes it.
			const active = document.activeElement;
			if (!active || active === document.body || dialog?.contains(active)) {
				anchorRef.current?.focus({ preventScroll: true });
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
