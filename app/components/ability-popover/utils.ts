import type { InfoSection } from "#/types";

export const formatBonus = (value: string | number | undefined) => {
	if (value === undefined || value === null) return "—";
	if (typeof value === "number") {
		return Number.isInteger(value) ? String(value) : String(+value.toFixed(3));
	}
	return String(value);
};

/**
 * Every property key a single tooltip section renders - `basic_properties`
 * plus each block's `important_property`. Shared by `renderedKeys` (which
 * unions this across every section) and `AbilityDetail` (which needs it
 * per-section, to pair each section's properties with that section's own
 * `loc_string`).
 */
export function sectionPropertyKeys(section: InfoSection): string[] {
	return [
		...(section.basic_properties ?? []),
		// Some ability blocks (e.g. The Doorman's Bomb/Luggage Cart, Silver's
		// Lycan Curse) carry a `properties_block` entry with no `properties`
		// array at all - `?? []` on the block itself, not just the outer array.
		...(section.properties_block?.flatMap(
			(block) => block.properties?.map((p) => p.important_property) ?? [],
		) ?? []),
	];
}

/**
 * Every property key an ability's tooltip actually renders, across all
 * sections. A changed property in this set gets its delta inline on the chip
 * (`PropertyList`'s `previousValues`); anything outside it has nowhere to
 * render inline and falls back to the orphan `StatDelta` strip in
 * `ability-detail.tsx`.
 *
 * Measured against the current patch: 5 of 9 changed ability properties are
 * orphans (Mini Turret's `DecayingResist`/`DecayingResistDuration`,
 * Petrifying Bola's `Radius`/`PetrifyDuration`, Stalker's Mark's
 * `AbilityCooldown`) - the strip is the majority path, not a rare fallback.
 */
export function renderedKeys(sections: InfoSection[]): Set<string> {
	return new Set(sections.flatMap(sectionPropertyKeys));
}
