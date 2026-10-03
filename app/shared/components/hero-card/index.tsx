import clsx from "clsx";
import type { ReactNode, Ref } from "react";
import CutFrame from "#/shared/components/cut-frame";
import { accentOf } from "#/shared/utils/heroAccent";
import type { Hero } from "#/types";
import Header from "./header";
import Name from "./name";
import ViewHeroCta from "./view-hero-cta";

/**
 * The shell every hero card shares: a frame in the hero's theme colour around
 * a dark panel. What goes inside is up to the page - usually a
 * `HeroCard.Header` followed by the page's own body.
 */
function HeroCard({
	hero,
	className,
	ref,
	children,
}: {
	hero: Hero;
	/** Layout only (margin, sizing) - lands on the outer frame. */
	className?: string;
	/** On the outer frame - e.g. for scroll-to targets. */
	ref?: Ref<HTMLSpanElement>;
	children: ReactNode;
}) {
	return (
		<CutFrame
			ref={ref}
			color={accentOf(hero)}
			width={2}
			className={clsx("flex", className)}
		>
			<article className="cut-double relative flex min-w-0 flex-1 flex-col bg-[#1b1b24]">
				{children}
			</article>
		</CutFrame>
	);
}

export default Object.assign(HeroCard, { Header, Name, Cta: ViewHeroCta });
