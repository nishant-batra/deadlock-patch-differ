// app/utils/negativeProperties.ts
//
// `negative_attribute` is present on only 19 properties catalog-wide, and is
// absent from `AbilityCooldown` and its siblings entirely - so a cooldown
// increase (a nerf) reads green with no override. This is the override,
// consulted only when the payload itself has no `negative_attribute`.

/**
 * Properties where a bigger number is worse. Verified against the current
 * catalog: none of these three carry `negative_attribute` on any item or
 * ability, despite a longer cooldown/cast delay/channel time always being a
 * nerf. `AbilityDuration` is deliberately excluded - it is often a buff's own
 * duration, where longer is better, so it is left to the payload's own
 * `negative_attribute` (absent -> neutral) rather than guessed here.
 */
const NEGATIVE_PROPERTY_KEYS = new Set([
	"AbilityCooldown",
	"AbilityCastDelay",
	"AbilityChannelTime",
]);

export const isNegativeProperty = (key: string) =>
	NEGATIVE_PROPERTY_KEYS.has(key);
