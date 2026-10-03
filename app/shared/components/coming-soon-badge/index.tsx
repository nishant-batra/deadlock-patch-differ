import { textOn } from "#/shared/utils/heroAccent";

/** Accent-coloured "Coming soon" tag for an announced hero. */
export default function ComingSoonBadge({
	accent,
	className,
}: {
	accent: string;
	className?: string;
}) {
	return (
		<span
			className={`cut-corner self-start font-bold uppercase tracking-widest ${className ?? ""}`}
			style={{ background: accent, color: textOn(accent) }}
		>
			Coming soon
		</span>
	);
}
