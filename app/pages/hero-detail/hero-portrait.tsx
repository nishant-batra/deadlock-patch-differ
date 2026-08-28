import type { Hero } from "#/types";

/**
 * The hero detail page's identity image. Uses the hero's `hero_card_gloat`
 * art (a portrait render, 280x380 upstream) rather than `background_image` -
 * that field is a wide scene banner, not a hero portrait, and cropped down to
 * catalog-icon size it read as the wrong image entirely. Sized at exactly
 * half the source's 280x380 so nothing gets stretched or cropped.
 *
 * Mirrors `HeroAvatar`'s fallback approach rather than reusing it directly
 * (that component is hard-coded to the icon fields): a plain `<img>`, not a
 * `<picture>`, because a `<picture>`'s webp `<source>` 404ing does not fall
 * back - at least one hero (Boho) is missing its webp upstream.
 */
export default function HeroPortrait({
	hero,
}: {
	hero: Pick<Hero, "name" | "images">;
}) {
	const webp = hero.images?.hero_card_gloat_webp;
	const png = hero.images?.hero_card_gloat;
	const fallbackPng = hero.images?.icon_hero_card;
	const fallbackWebp = hero.images?.icon_hero_card_webp;
	const src = webp ?? png ?? fallbackWebp ?? fallbackPng;

	return (
		<img
			src={src}
			onError={(event) => {
				const img = event.currentTarget;
				// Walk the same fallback chain on error: gloat webp -> gloat png ->
				// icon webp -> icon png.
				const chain = [png, fallbackWebp, fallbackPng].filter(
					(candidate): candidate is string =>
						Boolean(candidate) && candidate !== img.src,
				);
				const next = chain[0];
				if (next) img.src = next;
			}}
			alt={hero.name}
			width={140}
			height={190}
			className="rounded-lg object-cover"
		/>
	);
}
