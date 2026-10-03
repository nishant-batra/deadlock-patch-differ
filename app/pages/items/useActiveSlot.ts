import { useCallback, useRef, useState } from "react";
import { itemTypes } from "#/shared/components/item-card/constants";
import { stickyBarRef } from "#/shared/utils/stickyBarRef";
import type { ItemSlotType } from "#/types";

/** Whether jumping to `section` will actually scroll the page - false when
 * it's already in place, or when the page can't move that way (a section near
 * the bottom never reaches the top). */
function willScrollTo(section: HTMLElement) {
	const drift =
		section.getBoundingClientRect().top -
		Number.parseFloat(getComputedStyle(section).scrollMarginTop);
	const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
	if (Math.abs(drift) <= 1) return false;
	if (drift > 0) return window.scrollY < maxScroll - 1;
	return window.scrollY > 0;
}

/**
 * The slot section currently under the sticky switch bar.
 *
 * `barRef` is a callback ref: attaching the bar starts an IntersectionObserver
 * whose root is shrunk to a 1px line just below it (where the bar sits once
 * stuck) - whichever section crosses that line is active. Between sections
 * (their bottom margin) nothing crosses it, so the previous slot stays lit.
 *
 * `select` is for clicks: the clicked slot lights up at once, and observer
 * updates are ignored until the smooth scroll ends - otherwise Weapon ->
 * Vitality would flash Spirit on the way past.
 */
export function useActiveSlot() {
	const [active, setActive] = useState<ItemSlotType>(itemTypes[0]);
	// Set while a clicked tab's scroll is in flight; aborting it removes that
	// hold's listeners.
	const hold = useRef<AbortController | null>(null);
	// The live observer's `connect`, so releasing a hold can resync with it.
	const reconnect = useRef<(() => void) | null>(null);

	// Stable identity, or React would detach and re-attach (disconnect and
	// rebuild the observer) on every render.
	const barRef = useCallback((bar: HTMLElement | null) => {
		if (!bar) return;
		let observer: IntersectionObserver | undefined;

		// rootMargin only takes px/%, not `var(--nav-height)`, so the line is
		// measured - and re-measured on resize, when the navbar can rewrap.
		// `top` is where the bar sticks, not where it is right now.
		const connect = () => {
			observer?.disconnect();
			const line =
				Number.parseFloat(getComputedStyle(bar).top) + bar.offsetHeight;
			observer = new IntersectionObserver(
				(entries) => {
					if (hold.current) return;
					for (const { isIntersecting, target } of entries) {
						if (isIntersecting) setActive(target.id as ItemSlotType);
					}
				},
				{
					rootMargin: `-${line}px 0px -${window.innerHeight - line - 1}px 0px`,
				},
			);
			// Sections render in the same commit as the bar, so they're in the
			// DOM by the time React attaches this ref.
			for (const type of itemTypes) {
				const section = document.getElementById(type);
				if (section) observer.observe(section);
			}
		};

		connect();
		reconnect.current = connect;
		window.addEventListener("resize", connect);
		// Here rather than a second ref on the bar - merging two callback refs
		// takes an inline function, which React re-attaches every render.
		const unmeasure = stickyBarRef(bar);
		return () => {
			unmeasure?.();
			window.removeEventListener("resize", connect);
			observer?.disconnect();
			hold.current?.abort();
			reconnect.current = null;
		};
	}, []);

	const select = (type: ItemSlotType) => {
		hold.current?.abort();
		hold.current = null;
		setActive(type);
		const section = document.getElementById(type);
		// Hold only when a scroll will happen and `scrollend` will end it -
		// otherwise nothing would ever release the hold. Without `scrollend`
		// (Safari < 26) the fill may flicker past the middle section.
		if (!section || !("onscrollend" in window) || !willScrollTo(section)) {
			return;
		}

		const controller = new AbortController();
		hold.current = controller;
		const release = () => {
			controller.abort();
			if (hold.current !== controller) return;
			hold.current = null;
			// The observer only reports changes, and the ones during the hold were
			// dropped - a fresh observer reports every section's current state.
			reconnect.current?.();
		};
		const { signal } = controller;
		// Release on arrival only: a `scrollend` can be left over from a scroll
		// that was still settling when the tab was clicked. Arrival also covers
		// a section near the bottom that can only get partway.
		window.addEventListener(
			"scrollend",
			() => {
				if (!willScrollTo(section)) release();
			},
			{ signal },
		);
		// The user taking over mid-scroll hands the fill back to the observer.
		for (const event of ["wheel", "touchstart", "keydown"]) {
			window.addEventListener(event, release, { signal, passive: true });
		}
	};

	return { barRef, active, select };
}
