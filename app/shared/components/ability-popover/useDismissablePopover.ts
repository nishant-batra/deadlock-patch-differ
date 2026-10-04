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
 * React state. A state update from a layout effect is held back until after
 * the view transition has started, so the enter animation's snapshot was
 * taken at the unpositioned corner and the dialog jumped into place once it
 * finished. A direct write lands before the browser takes that snapshot -
 * and scrolling no longer re-renders the whole card.
 */
export function useDismissablePopover(
	anchorRef: React.RefObject<HTMLElement | null>,
	onClose: () => void,
) {
	const ref = useRef<HTMLDivElement>(null);

	// Read via a ref rather than depending on `onClose` directly: its identity
	// changes every render (`useOpenAbility` recreates it each time), which
	// would otherwise re-run this effect - and re-register its listeners - on
	// every render regardless of what React Compiler decides to memoize.
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	// `place()` reads `anchorRef.current` and `onCloseRef.current` fresh on
	// every call rather than capturing them, so this is correctly mount-only
	// despite the lint - re-running per render would just re-attach the same
	// listeners (harmless), but `anchorRefFor` (in useOpenAbility.ts) returns a
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

		// useLayoutEffect runs after the dialog is committed to the DOM but
		// before the browser paints, so its real `offsetHeight` is already
		// available here - no flash of the wrong position on open.
		place();

		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") onCloseRef.current();
		};
		const onPointer = (event: MouseEvent) => {
			if (!ref.current?.contains(event.target as Node)) onCloseRef.current();
		};
		document.addEventListener("keydown", onKey);
		// Deferred: the click that opened the popover is still propagating.
		const timeoutId = setTimeout(
			() => document.addEventListener("mousedown", onPointer),
			0,
		);
		window.addEventListener("scroll", place, { capture: true, passive: true });
		window.addEventListener("resize", place);

		return () => {
			document.removeEventListener("keydown", onKey);
			document.removeEventListener("mousedown", onPointer);
			clearTimeout(timeoutId);
			window.removeEventListener("scroll", place, { capture: true });
			window.removeEventListener("resize", place);
		};
	}, []);

	return ref;
}
