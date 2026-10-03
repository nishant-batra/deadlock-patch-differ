import { Link } from "@tanstack/react-router";
import type { Ref } from "react";
import AbilityRow from "#/shared/components/ability-row";
import CutFrame from "#/shared/components/cut-frame";
import { AMBER_BORDER } from "#/shared/components/cut-frame/constants";
import HeroAvatar from "#/shared/components/hero-avatar";
import { accentOf } from "#/shared/utils/heroAccent";
import { heroSlug } from "#/shared/utils/heroSlug";
import type { HeroEntry } from "#/types";

/**
 * A hero's roster card - framed in its own theme colour, with the same ability
 * row `HeroCard` uses (tiers render the hero's real upgrades, with `equal`
 * rows since nothing is being diffed). Stats live on the hero page.
 */
export default function HeroProfileCard({
	hero,
	abilities,
	ref,
}: HeroEntry & {
	/** On the outer frame - the roster search scrolls to it. */
	ref?: Ref<HTMLSpanElement>;
}) {
	return (
		<CutFrame
			ref={ref}
			color={accentOf(hero)}
			width={2}
			className="m-3 flex min-w-80 max-w-100"
		>
			<article className="cut-double flex flex-1 flex-col bg-[#1b1b24]">
				<header className="flex items-center justify-between gap-3 bg-[#2a2a36] p-2.5">
					<div className="flex items-center gap-3">
						<HeroAvatar
							hero={hero}
							className="cut-double [--cut:var(--cut-md)]"
						/>
						<h3 className="font-extrabold text-lg">{hero.name}</h3>
					</div>
					<CutFrame
						color={AMBER_BORDER}
						cut="5px"
						className="inline-flex shrink-0"
					>
						<Link
							to="/heroes/$heroSlug"
							params={{ heroSlug: heroSlug(hero.name) }}
							className="cut-corner py-1.5 pr-4 pl-2.5 font-bold text-xs"
						>
							View hero →
						</Link>
					</CutFrame>
				</header>

				<AbilityRow abilities={abilities} />
			</article>
		</CutFrame>
	);
}
