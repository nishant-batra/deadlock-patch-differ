import type { Hero } from "#/types";

/**
 * The hero page's identity image. Prefers the hero's `hero_card_gloat` art (a
 * portrait render, 280x380 upstream) rather than `background_image` - that
 * field is a wide scene banner, not a hero portrait. Sized at exactly half the
 * gloat's 280x380 so it is neither stretched nor cropped.
 *
 * Announced heroes ship no gloat or card icon, only the narrow
 * `top_bar_vertical_image`, so that is the last fallback. `object-contain` on
 * the accent background letterboxes it instead of cropping.
 *
 * A plain `<img>`, not a `<picture>`, because a `<picture>`'s webp `<source>`
 * 404ing does not fall back - at least one hero (Boho) is missing its webp
 * upstream. `onError` walks the chain instead.
 */
export default function HeroPortrait({
	hero: { name, images },
	accent,
}: {
	hero: Pick<Hero, "name" | "images">;
	accent: string;
}) {
	const chain = [
		images?.hero_card_gloat_webp,
		images?.hero_card_gloat,
		images?.icon_hero_card_webp,
		images?.icon_hero_card,
		images?.top_bar_vertical_image_webp,
		images?.top_bar_vertical_image,
	].filter((candidate): candidate is string => Boolean(candidate));

	if (chain.length === 0) return null;

	return (
		<img
			src={chain[0]}
			onError={(event) => {
				const img = event.currentTarget;
				const next = chain[chain.indexOf(img.getAttribute("src") ?? "") + 1];
				if (next) img.src = next;
			}}
			alt={name}
			width={140}
			height={190}
			className="cut-double object-contain"
			style={{ background: accent }}
		/>
	);
}
