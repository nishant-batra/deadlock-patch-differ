import { listedTooltipKeys } from "#/lib/statusEffects";
import type { TooltipSection } from "#/types";

/**
 * Every property key an item's tooltip sections actually render - the union
 * of `important_properties`, `elevated_properties`, and `properties`, plus the
 * duration each status badge shows, minus `AbilityCooldown` (drawn separately
 * as the section-bar pill, never through `PropertyList`). A changed property
 * in this set gets its delta inline on the chip; anything outside it falls
 * back to the top strip.
 */
export function renderedKeys(
	sections: TooltipSection[] | undefined,
	statusDurations: Map<string, string>,
): Set<string> {
	const keys = listedTooltipKeys(sections);
	keys.delete("AbilityCooldown");
	for (const durationKey of statusDurations.values()) keys.add(durationKey);
	return keys;
}
