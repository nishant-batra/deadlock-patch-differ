import { ADSENSE_PUBLISHER_ID } from "#/components/ad-slot/constants";
import { useAdSlot } from "#/components/ad-slot/useAdSlot";

type AdSlotProps = Readonly<{
	slotId: string;
	className?: string;
	/** Wraps the ad in an extra element (e.g. for a sticky rail that needs its
	 * own stretched container). Collapses along with the ad when unfilled. */
	wrapperClassName?: string;
	format?: string;
}>;

export default function AdSlot({
	slotId,
	className,
	wrapperClassName,
	format = "auto",
}: AdSlotProps) {
	const { insRef, status } = useAdSlot(ADSENSE_PUBLISHER_ID);

	if (!ADSENSE_PUBLISHER_ID) {
		// Dev-only stand-in so placement/responsiveness can be checked before a
		// real publisher ID exists. Renders nothing in production.
		if (!import.meta.env.DEV) return null;
		const placeholder = (
			<div
				className={`flex min-h-[90px] items-center justify-center rounded border border-white/20 border-dashed bg-white/5 text-white/40 text-xs ${className ?? ""}`}
			>
				Ad ({slotId})
			</div>
		);
		return wrapperClassName ? (
			<div className={wrapperClassName}>{placeholder}</div>
		) : (
			placeholder
		);
	}

	// AdSense resolved the request and had nothing to serve - don't leave an
	// empty container (or its wrapper) taking up space.
	if (status === "unfilled") return null;

	const ins = (
		<ins
			ref={insRef}
			className={`adsbygoogle block ${className ?? ""}`}
			style={{ display: "block" }}
			data-ad-client={ADSENSE_PUBLISHER_ID}
			data-ad-slot={slotId}
			data-ad-format={format}
			data-full-width-responsive="true"
		/>
	);

	return wrapperClassName ? (
		<div className={wrapperClassName}>{ins}</div>
	) : (
		ins
	);
}
