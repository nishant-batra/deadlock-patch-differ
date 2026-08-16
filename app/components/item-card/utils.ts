import type { TooltipSection } from "#/types";

/**
 * Every property key an item's tooltip sections actually render - the union
 * of `important_properties`, `elevated_properties`, and `properties`, minus
 * `AbilityCooldown` (drawn separately as the section-bar pill, never through
 * `PropertyList`). A changed property in this set gets its delta inline on
 * the chip; anything outside it falls back to the top strip.
 */
export function renderedKeys(
	sections: TooltipSection[] | undefined,
): Set<string> {
	const keys = (sections ?? []).flatMap((section) =>
		(section.section_attributes ?? []).flatMap((attribute) => [
			...(attribute.important_properties ?? []),
			...(attribute.elevated_properties ?? []),
			...(attribute.properties ?? []),
		]),
	);
	return new Set(keys.filter((key) => key !== "AbilityCooldown"));
}
