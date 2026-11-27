// `negative_attribute` is present on only a handful of properties, so this is
// the fallback for "is a bigger number worse?", consulted only when the payload
// itself has no `negative_attribute`.
import type { ItemProperty } from "#/types";

/**
 * Item stats that shrink a property when you buy them (cooldown reduction).
 * Any other scale type (duration, range, radius, spirit power...) grows it, so
 * the game itself treats bigger as better there. This beats `css_class`: Shiv's
 * Recast Window wears the cooldown icon but scales with duration.
 */
const SHRINKING_SCALE_TYPES = new Set([
	"ETechCooldown",
	"ETechCooldownBetweenChargeUses",
]);

/**
 * Timings with no scale function where longer is a nerf - cooldowns, wind-ups,
 * delays, wait times - minus the stats that cut them (Cooldown Reduction,
 * Cooldown Refund). `Duration`/`Lifetime`/`Window` are deliberately left out:
 * those are usually the effect's own length, where longer is better.
 * shortcut: name-based guess, so a new oddly named stat can still land the
 * wrong way; extend these patterns when one shows up.
 */
const SLOWER_IS_WORSE =
	/Cooldown|CastDelay|ChannelTime|Delay$|WindUp|BuildupTime|DeployTime|CompletedTime|BrewTime/;
const CUTS_THE_WAIT = /Reduc|Refund|Refresh|Reset|Speed|Chance/;
/** Costs paid by the caster, e.g. Geist's Essence Bomb "Health Cost" (SelfDamagePct). */
const COST_TO_SELF = /SelfDamage/;

export function isNegativeProperty(
	key: string,
	property?: Pick<ItemProperty, "scale_function">,
) {
	const scaleType = property?.scale_function?.specific_stat_scale_type;
	if (scaleType) return SHRINKING_SCALE_TYPES.has(scaleType);
	if (COST_TO_SELF.test(key)) return true;
	return SLOWER_IS_WORSE.test(key) && !CUTS_THE_WAIT.test(key);
}
