import { listedTooltipKeys, statusEffectDurations } from "#/lib/statusEffects";
import type { DisplayChange, Item, ItemProperty } from "#/types";

/** The only `ItemProperty` fields an item card reads (`PropertyList`,
 * `StatusChip`, `resolveDeltaRows`).
 *
 * Not enforced by the type system: the trimmed item is still typed as `Item`
 * (every field but `value` is optional), so if the item card starts reading a
 * new property field, add it here or it will silently render blank on
 * `/items`. */
const RENDERED_FIELDS = [
	"value",
	"label",
	"prefix",
	"postfix",
	"icon",
	"tooltip_is_important",
	"tooltip_is_elevated",
	"tooltip_section",
	"usage_flags",
	"negative_attribute",
] as const satisfies ReadonlyArray<keyof ItemProperty>;

/**
 * An item cut down to what its catalog card renders - roughly 60% of the raw
 * payload is properties the tooltip never lists (scaling internals, token
 * overrides) and fields no component reads. Kept: every key a tooltip section
 * lists, the `AbilityCooldown` pill, status-badge durations, and any key that
 * changed this patch (the change strip still needs its prefix/postfix).
 *
 * Done at the `/items` boundary, not at ingest: the diff engine still needs
 * the full properties.
 */
export function toCatalogItem(item: Item, changes?: DisplayChange[]): Item {
	const { shop_image, properties, tooltip_sections, ...rest } = item;
	const keep = listedTooltipKeys(tooltip_sections);
	keep.add("AbilityCooldown");
	for (const durationKey of statusEffectDurations(item).values()) {
		keep.add(durationKey);
	}
	for (const change of changes ?? []) {
		if ("key" in change) keep.add(change.key);
	}

	const trimmed: Item["properties"] = {};
	for (const key of keep) {
		const property = properties[key];
		if (!property) continue;
		// A key-allowlist replacer copies just those fields and drops absent
		// ones, rather than sending them as `undefined`.
		trimmed[key] = JSON.parse(JSON.stringify(property, [...RENDERED_FIELDS]));
	}

	return { ...rest, tooltip_sections, properties: trimmed };
}
