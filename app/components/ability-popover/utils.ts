import type { InfoSection } from "#/types";

export const formatBonus = (value: string | number | undefined) => {
	if (value === undefined || value === null) return "—";
	if (typeof value === "number") {
		return Number.isInteger(value) ? String(value) : String(+value.toFixed(3));
	}
	return String(value);
};

/**
 * Every property key an ability's tooltip actually renders - the union of
 * `basic_properties` and each block's `important_property`. A changed
 * property in this set gets its delta inline on the chip (`PropertyList`'s
 * `previousValues`); anything outside it has nowhere to render inline and
 * falls back to the orphan `StatDelta` strip in `ability-detail.tsx`.
 *
 * Measured against the current patch: 5 of 9 changed ability properties are
 * orphans (Mini Turret's `DecayingResist`/`DecayingResistDuration`,
 * Petrifying Bola's `Radius`/`PetrifyDuration`, Stalker's Mark's
 * `AbilityCooldown`) - the strip is the majority path, not a rare fallback.
 */
export function renderedKeys(sections: InfoSection[]): Set<string> {
	return new Set(
		sections.flatMap((section) => [
			...(section.basic_properties ?? []),
			...(section.properties_block?.flatMap((block) =>
				block.properties.map((p) => p.important_property),
			) ?? []),
		]),
	);
}
