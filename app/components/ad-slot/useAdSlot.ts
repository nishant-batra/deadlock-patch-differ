import { useCallback, useRef, useState } from "react";

declare global {
	interface Window {
		adsbygoogle?: Array<Record<string, unknown>>;
	}
}

type AdFillStatus = "pending" | "filled" | "unfilled";

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

			if (!pushed.current) {
				pushed.current = true;
				try {
					window.adsbygoogle ??= [];
					window.adsbygoogle.push({});
				} catch {
					// AdSense script not loaded yet (e.g. blocked by an ad blocker) - no-op.
				}
			}

			return () => observer.disconnect();
		},
		[publisherId],
	);

	return { insRef, status };
}
