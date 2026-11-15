import { hasTierChanges, type TierDiff } from "#/lib/abilityUpgrades";
import { isScaleChange, isStatChange } from "#/lib/diffEngine";
import { abilityDeltaRow } from "#/shared/components/ability-card/utils";
import { isTierTouched } from "#/shared/components/ability-tier/utils";
import { deltaDirection } from "#/shared/components/stat-delta";
import type { AbilityChange, Change } from "#/types";

/** Whether this patch touched the ability at all - what frames its icon amber. */
export const isAbilityChanged = ({
	changes,
	tiers,
}: Pick<AbilityChange, "changes" | "tiers">) =>
	changes.length > 0 || hasTierChanges(tiers);

const isTextChange = ({ path }: Change) => path.at(-1) === "loc_string";

/** Upgrade moves the per-tier diff already covers - same split as the popover. */
const isTierCovered = ({ path }: Change) =>
	path[0] === "upgrades" ||
	(path[0] === "description" && /^t\d_desc$/.test(path[1]));

/**
 * A tier blurb ("+150 Damage and +15% Damage Reduction") restates that tier's
 * bonuses, so when a bonus moved the rewrite is just the number again - the
 * tier rows already show it. Only a rewrite with every bonus unchanged is
 * real wording. The popover still shows the text diff either way.
 */
const isTierRewording = ({ text, rows }: TierDiff) =>
	Boolean(text) && rows.every(({ kind }) => kind === "equal");

/**
 * Description and tier text rewrites whose bonuses did not move, plus anything
 * else unrecognised - what neither a buff/nerf count nor a tier label covers.
 */
export function hasWordingChange({ changes, tiers }: AbilityChange) {
	const hasWording = changes.some(isTextChange) || tiers.some(isTierRewording);
	const hasOther = changes.some(
		(change) =>
			!isStatChange(change) &&
			!isScaleChange(change) &&
			!isTextChange(change) &&
			!isTierCovered(change),
	);
	return hasWording || hasOther;
}

/**
 * The marker under a changed icon: how many stat and scaling moves were buffs
 * and nerfs, which upgrade tiers moved, and whether anything was reworded.
 * Tier bonuses are named, not counted: a tier's "-5s" is a cooldown cut, so
 * its sign can't be read the way a stat's can.
 */
export function abilityMarkers(abilityChange: AbilityChange) {
	const {
		ability: { properties = {} },
		changes,
		tiers,
	} = abilityChange;
	let buffs = 0;
	let nerfs = 0;
	for (const change of changes) {
		if (!isStatChange(change) && !isScaleChange(change)) continue;
		const direction = deltaDirection(abilityDeltaRow(change, properties));
		if (direction === "better") buffs++;
		if (direction === "worse") nerfs++;
	}
	return {
		buffs,
		nerfs,
		tiers: tiers.filter(isTierTouched).map(({ tier }) => tier),
		wording: hasWordingChange(abilityChange),
	};
}
