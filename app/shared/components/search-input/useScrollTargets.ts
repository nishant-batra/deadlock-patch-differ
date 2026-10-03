import { useRef } from "react";

/**
 * Name -> element map for the cards a search can jump to. `targetRef(name)`
 * is the card's callback ref; `scrollTo(name)` centres that card and flashes
 * it so the eye finds it.
 */
export function useScrollTargets() {
	const targets = useRef(new Map<string, HTMLElement>());
	// One callback per name, kept across renders - a fresh function each render
	// would make React detach and re-attach every card's ref.
	const refs = useRef(
		new Map<string, (element: HTMLElement | null) => () => void>(),
	);

	const targetRef = (name: string) => {
		let ref = refs.current.get(name);
		if (!ref) {
			ref = (element) => {
				if (element) targets.current.set(name, element);
				return () => targets.current.delete(name);
			};
			refs.current.set(name, ref);
		}
		return ref;
	};

	const scrollTo = (name: string) => {
		const target = targets.current.get(name);
		if (!target) return;
		// Top-aligned, so a card taller than the screen still shows its name -
		// the caller gives the card a scroll-margin that clears the sticky bars.
		target.scrollIntoView({ block: "start", behavior: "smooth" });
		// A filter, not an outline: cards are clip-pathed, which would cut a
		// ring off at the corners.
		target.animate(
			[
				{ filter: "brightness(1)" },
				{ filter: "brightness(1.6)", offset: 0.35 },
				{ filter: "brightness(1)" },
			],
			{ duration: 1600, easing: "ease-out" },
		);
	};

	return { targetRef, scrollTo };
}
