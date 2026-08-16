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

	if (!ADSENSE_PUBLISHER_ID) return null;

	// AdSense resolved the request and had nothing to serve - don't leave an
	// empty container (or its wrapper) taking up space.
	if (status === "unfilled") return null;

	// The <ins> must stay mounted while pending - AdSense needs it in the DOM
	// to measure and fill it - so a shimmer is layered on top instead of
	// hiding it, and swaps out once `status` becomes "filled".
	const ins = (
		<div className={`relative ${className ?? ""}`}>
			<ins
				ref={insRef}
				className="adsbygoogle block min-h-[90px] w-full"
				style={{ display: "block" }}
				data-ad-client={ADSENSE_PUBLISHER_ID}
				data-ad-slot={slotId}
				data-ad-format={format}
				data-full-width-responsive="true"
			/>
			{status === "pending" && (
				<div
					className="absolute inset-0 animate-pulse rounded bg-white/10"
					aria-hidden="true"
				/>
			)}
		</div>
	);

	return wrapperClassName ? (
		<div className={wrapperClassName}>{ins}</div>
	) : (
		ins
	);
}
