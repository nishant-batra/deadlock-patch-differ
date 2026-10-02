import { type ChangeValue, isScaleChange, statKeyOf } from "#/lib/diffEngine";
import type { DeltaRow } from "#/shared/components/stat-delta";
import { isNegativeProperty } from "#/shared/utils/negativeProperties";
import { humaniseStatKey } from "#/shared/utils/statLabels";
import type { Change, InfoSection, Item } from "#/types";

/** Property values are scalars; anything else has no delta row to show. */
const scalarOnly = (value: ChangeValue | undefined) =>
	typeof value === "string" || typeof value === "number" ? value : undefined;

/**
 * One `properties.X.value` or `properties.X.scale_function.stat_scale` change
 * as a `StatDelta` row. Shared by the popover's strip and the hero card's
 * ability list, so both label and colour a move the same way.
 */
export function abilityDeltaRow(
	change: Change,
	allProperties: Item["properties"],
): DeltaRow {
	const { path, kind, old, new: next } = change;
	const key = statKeyOf(change);
	const { label, negative_attribute, prefix, postfix } =
		allProperties[key] ?? {};
	const name = label ?? humaniseStatKey(key);
	const scale = isScaleChange(change);
	return {
		id: path.join("."),
		label: scale ? `${name} Scaling` : name,
		kind: kind === "added" ? "added" : kind === "removed" ? "removed" : "stat",
		old: scalarOnly(old),
		new: scalarOnly(next),
		// AbilityCooldown and siblings carry no `negative_attribute` in the
		// payload at all - see negativeProperties.ts.
		negativeAttribute: negative_attribute ?? isNegativeProperty(key),
		// `stat_scale` is a unitless per-point multiplier, not the property's own
		// displayed value, so the property's "%"/"m" units do not apply to it.
		...(scale ? {} : { prefix, postfix }),
	};
}

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
