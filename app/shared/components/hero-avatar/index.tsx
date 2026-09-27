import type { Hero } from "#/types";

export default function HeroAvatar({
	hero,
	size = 44,
	className = "rounded",
}: {
	hero: Pick<Hero, "name" | "images">;
	size?: number;
	/** Defaults to the plain rounded look - hero-card/hero-profile-card opt
	 * into the cut-steel treatment explicitly rather than it changing here
	 * silently for every consumer (hero-detail included). */
	className?: string;
}) {
	return (
		// Not a <picture>: a 404 on the webp <source> would not fall back, and
		// at least one hero (Boho) is missing its webp upstream.
		<img
			src={hero.images?.icon_hero_card_webp ?? hero.images?.icon_hero_card}
			onError={(event) => {
				const img = event.currentTarget;
				const png = hero.images?.icon_hero_card;
				if (png && img.src !== png) img.src = png;
			}}
			alt={hero.name}
			width={size}
			height={size}
			className={className}
		/>
	);
}
