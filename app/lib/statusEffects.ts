// app/lib/statusEffects.ts
//
// Status effects (Stun, Silence, Disarm...) are listed in a tooltip's
// `important_properties` as `StatusEffectX`, but that key has no entry in
// `properties` - the game renders it as a badge. Since build 6722 the badge
// also carries the effect's duration ("Stunned 0.5s"), and the separate
// "Stun Duration" line was dropped from the tooltip lists: Knockdown,
// Lightning Scroll, Mystical Piano, Silencer, Silence Wave, Focus Lens. The
// duration property itself is unchanged, so it has to be found by name.

import type { Item, TooltipSection } from "#/types";
import { isEmptyStatValue } from "./statValue";

/** Effects whose duration property is not simply `${Effect}Duration`. */
const EXTRA_DURATION_KEYS: Record<string, string[]> = {
	EMP: ["SilenceDuration", "EMPDuration"],
	Disarmed: ["DisarmDuration"],
	Invisible: ["InvisDuration"],
};

export const isStatusEffectKey = (key: string) =>
	key.startsWith("StatusEffect");

/** Every property key listed anywhere in an item's tooltip sections. */
export function listedTooltipKeys(
	sections: TooltipSection[] | undefined,
): Set<string> {
	const keys = new Set<string>();
	for (const { section_attributes } of sections ?? []) {
		for (const {
			important_properties,
			elevated_properties,
			properties,
		} of section_attributes ?? []) {
			for (const key of important_properties ?? []) keys.add(key);
			for (const key of elevated_properties ?? []) keys.add(key);
			for (const key of properties ?? []) keys.add(key);
		}
	}
	return keys;
}

/**
 * The property holding a status effect's duration, or `undefined` when the
 * badge carries none. Candidates are tried in order and the first one the item
 * has decides: when that property is already its own tooltip line (Disarming
 * Hex lists `AbilityDuration` beside its Disarmed badge), the badge must not
 * repeat it, and a 0 means the effect has no fixed duration (Phantom Strike).
 */
export function statusEffectDurationKey(
	effectKey: string,
	properties: Item["properties"] | undefined,
	listed: Set<string>,
): string | undefined {
	const effect = effectKey.replace(/^StatusEffect/, "");
	const candidates = [
		`${effect}Duration`,
		...(EXTRA_DURATION_KEYS[effect] ?? []),
		"AbilityDuration",
	];
	for (const key of candidates) {
		const property = properties?.[key];
		if (!property) continue;
		return listed.has(key) || isEmptyStatValue(property.value)
			? undefined
			: key;
	}
	return undefined;
}

/**
 * Status-effect key -> the duration property its badge renders, for every
 * badge on an item that carries one.
 */
export function statusEffectDurations({
	properties,
	tooltip_sections,
}: {
	properties?: Item["properties"];
	tooltip_sections?: TooltipSection[];
}): Map<string, string> {
	const listed = listedTooltipKeys(tooltip_sections);
	const durations = new Map<string, string>();
	for (const key of listed) {
		if (!isStatusEffectKey(key)) continue;
		const durationKey = statusEffectDurationKey(key, properties, listed);
		if (durationKey) durations.set(key, durationKey);
	}
	return durations;
}
