import ComingSoonBadge from "#/shared/components/coming-soon-badge";
import HeroCard from "#/shared/components/hero-card";
import HeroTags from "#/shared/components/hero-tags";
import { accentOf } from "#/shared/utils/heroAccent";
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
		<HeroCard hero={hero} className="min-w-0 flex-1">
			<HeroCard.Header hero={hero}>
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
					<HeroCard.Name name={name} />
					<HeroTags tags={tags} className="gap-1 text-gray-300 text-xs" />
				</div>
			</HeroCard.Header>
		</HeroCard>
	);
}
