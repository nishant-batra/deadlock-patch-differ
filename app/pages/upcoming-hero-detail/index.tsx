import EmptyState from "#/shared/components/empty-state";
import HeroBreadcrumb from "#/shared/components/hero-breadcrumb";
import HeroHeader from "#/shared/components/hero-header";
import type { Hero } from "#/types";

/**
 * `/heroes/$heroSlug` for an announced hero. Only the real data is shown -
 * portrait, name, theme colour, tags. Once the API marks the hero live, the
 * same URL renders the full `HeroDetail` instead; nothing here needs to
 * change.
 */
export default function UpcomingHeroDetail({ hero }: { hero: Hero }) {
	const { name } = hero;

	return (
		<main className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
			<HeroBreadcrumb name={name} />
			<HeroHeader hero={hero} />
			<EmptyState>
				{name} has been announced but is not playable yet. Starting stats,
				level-up growth and abilities will appear on this page as soon as {name}{" "}
				is released.
			</EmptyState>
		</main>
	);
}
