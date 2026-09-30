import type { Hero } from "#/types";

/** Neutral steel for a hero the API ships without a theme colour. */
const FALLBACK_ACCENT = "#3a3a48";

/** The hero's own theme colour (e.g. Violet #653cbc), for its frame and badge. */
export const accentOf = ({ colors }: Hero) =>
	/^#[0-9a-f]{6}$/i.test(colors?.style_hex ?? "")
		? (colors?.style_hex as string)
		: FALLBACK_ACCENT;

/**
 * Near-black or white, whichever reads on `hex` - theme colours run from
 * Rat King's dark #733033 to Solomon's pale #AA9E7E, and white text on the
 * latter is unreadable. Uses WCAG relative luminance.
 */
export function textOn(hex: string): string {
	const channel = (offset: number) => {
		const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
		return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
	};
	const luminance =
		0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
	// Crossover where black and white text have equal contrast.
	return luminance > 0.179 ? "#111118" : "#ffffff";
}
