/**
 * Callback ref for a page's sticky bar (below the navbar): keeps
 * `--sticky-bar-height` on the bar's parent in sync with its real height, so
 * the scroll-margins of what jumps land under it can read it. The bar's height
 * varies - it wraps to two rows on narrow screens.
 *
 * A plain function, not a hook, so its identity is stable without
 * `useCallback`. Until it runs (SSR, before hydration), consumers fall back via
 * `var(--sticky-bar-height, <one-row height>)`.
 */
export function stickyBarRef(bar: HTMLElement | null) {
	const scope = bar?.parentElement;
	if (!bar || !scope) return;

	const setHeight = () =>
		scope.style.setProperty("--sticky-bar-height", `${bar.offsetHeight}px`);
	setHeight();
	const observer = new ResizeObserver(setHeight);
	observer.observe(bar);
	return () => {
		observer.disconnect();
		scope.style.removeProperty("--sticky-bar-height");
	};
}
