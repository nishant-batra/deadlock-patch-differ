import { Link } from "@tanstack/react-router";
import ComingSoonBadge from "#/shared/components/coming-soon-badge";
import CutFrame from "#/shared/components/cut-frame";
import HeroTags from "#/shared/components/hero-tags";
import { accentOf } from "#/shared/utils/heroAccent";
import { heroSlug } from "#/shared/utils/heroSlug";
import type { Hero } from "#/types";

/**
 * An announced hero: portrait, name, and the three personality tags - the
 * only real data the API ships for them. Stats, weapon and complexity are
 * placeholders until release, so they are deliberately not shown.
 */
export default function UpcomingHeroCard({ hero }: { hero: Hero }) {
	const { name, tags, images } = hero;
	const accent = accentOf(hero);
	const portrait =
		images?.top_bar_vertical_image_webp ?? images?.top_bar_vertical_image;

	return (
		<CutFrame color={accent} width={2} className="flex min-w-0 flex-1">
			<Link
				to="/heroes/$heroSlug"
				params={{ heroSlug: heroSlug(name) }}
				className="cut-double flex flex-1 items-center gap-3 bg-[#1b1b24] p-2.5 hover:bg-[#22222c]"
			>
				{portrait && (
					<img
						src={portrait}
						alt=""
						width={60}
						height={100}
						loading="lazy"
						className="cut-double shrink-0 [--cut:var(--cut-sm)]"
						style={{ background: accent }}
					/>
				)}
				<div className="flex min-w-0 flex-col gap-1.5">
					<ComingSoonBadge
						accent={accent}
						className="px-2 py-0.5 text-[11px]"
					/>
					<h3 className="font-extrabold text-lg leading-tight">{name}</h3>
					<HeroTags tags={tags} className="gap-1 text-gray-300 text-xs" />
				</div>
			</Link>
		</CutFrame>
	);
}
