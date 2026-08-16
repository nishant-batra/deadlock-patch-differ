import { useCallback, useRef, useState } from "react";

declare global {
	interface Window {
		adsbygoogle?: Array<Record<string, unknown>>;
	}
}

type AdFillStatus = "pending" | "filled" | "unfilled";

// If AdSense hasn't written data-ad-status by this point (script blocked,
// request stalled), treat the slot as unfilled so the wrapper collapses
// instead of holding empty space indefinitely.
const PENDING_TIMEOUT_MS = 3000;

/**
 * Pushes the ad request once per mounted <ins> element, as AdSense requires.
 * A ref guards against React 19 double-invoking the callback ref in dev.
 *
 * AdSense writes `data-ad-status="filled" | "unfilled"` onto the <ins> once
 * it resolves the request, so a MutationObserver on that attribute is how we
 * learn whether an ad actually showed up (there's no callback API for it).
 */
export function useAdSlot(publisherId: string | undefined) {
	const pushed = useRef(false);
	const [status, setStatus] = useState<AdFillStatus>("pending");

	const insRef = useCallback(
		(el: HTMLModElement | null) => {
			if (!publisherId || !el) return;

			const observer = new MutationObserver(() => {
				const adStatus = el.getAttribute("data-ad-status");
				if (adStatus === "filled" || adStatus === "unfilled") {
					setStatus(adStatus);
				}
			});
			observer.observe(el, {
				attributes: true,
				attributeFilter: ["data-ad-status"],
			});

			const timeout = window.setTimeout(() => {
				setStatus((current) =>
					current === "pending" ? "unfilled" : current,
				);
			}, PENDING_TIMEOUT_MS);

			if (!pushed.current) {
				pushed.current = true;
				try {
					window.adsbygoogle ??= [];
					window.adsbygoogle.push({});
				} catch {
					// AdSense script not loaded yet (e.g. blocked by an ad blocker) - no-op.
				}
			}

			return () => {
				observer.disconnect();
				window.clearTimeout(timeout);
			};
		},
		[publisherId],
	);

	return { insRef, status };
}
