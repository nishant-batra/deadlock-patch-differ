import { useEffect, useRef } from "react";

/**
 * Keeps the `--nav-height` custom property in sync with the navbar's real
 * rendered height. The meta strip's height varies (route-conditional anchor
 * chips, text wrapping at narrow widths), so a hardcoded offset drifts - the
 * sticky ad rail and every `section[id]`'s scroll-margin-top read this
 * property instead of a fixed value.
 */
export function useNavHeight<T extends HTMLElement>() {
	const ref = useRef<T>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const setHeight = () => {
			document.documentElement.style.setProperty(
				"--nav-height",
				`${el.offsetHeight}px`,
			);
		};

		setHeight();
		const observer = new ResizeObserver(setHeight);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return ref;
}
