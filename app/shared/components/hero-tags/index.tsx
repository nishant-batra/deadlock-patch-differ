import type { ReactNode } from "react";

/**
 * A hero's personality tags as chips. Chip padding is in `em`, so it follows
 * whatever text size the caller sets on `className`. `children` are extra
 * `<li>` chips appended after the tags (the hero header's gun and complexity).
 */
export default function HeroTags({
	tags = [],
	className,
	children,
}: {
	tags?: string[];
	className?: string;
	children?: ReactNode;
}) {
	if (tags.length === 0 && !children) return null;

	return (
		<ul className={`flex flex-wrap items-center ${className ?? ""}`}>
			{tags.map((tag) => (
				<li key={tag} className="rounded bg-white/10 px-[0.5em] py-0.5">
					{tag}
				</li>
			))}
			{children}
		</ul>
	);
}
