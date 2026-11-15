import { hasWordingChange } from "#/shared/components/ability-row/utils";
import type { DeltaRow } from "#/shared/components/stat-delta";
import { isNegativeHeroStat, labelForStatKey } from "#/shared/utils/statLabels";
import type { AbilityChange, Change, Item } from "#/types";

/** `index` is the ability's place in the hero's ability row - what opens its popover. */
export type WordingEntry = { ability: Item; index: number };

/**
 * The abilities the card names on its Wording line: description and tier text
 * rewrites whose bonuses did not move, plus anything else unrecognised. Number
 * moves (property values, spirit scaling, upgrade-tier bonuses) are left to the
 * icon markers and the ability popover.
 */
export const abilityWording = (abilities: AbilityChange[]): WordingEntry[] =>
	abilities.flatMap((abilityChange, index) =>
		hasWordingChange(abilityChange)
			? [{ ability: abilityChange.ability, index }]
			: [],
	);

/**
 * The stat a change moved is always the key under its section.
 *   ['starting_stats','max_health','value']            -> max_health
 *   ['standard_level_up_upgrades','MODIFIER_VALUE_…']  -> MODIFIER_VALUE_…
 *   ['scaling_stats','ETechArmorDamageReduction','scale'] -> ETechArmor…
 *   ['weapon_info','bullet_damage']                    -> bullet_damage
 */
const statKeyOf = (path: string[]) => path[1];

// A scaling row would otherwise read the same as the stat it scales.
const labelForStat = (path: string[]) =>
	labelForStatKey(statKeyOf(path)) +
	(path.at(-1) === "scale" ? " Scaling" : "");

/**
 * The hero card's top strip: the hero's own stat moves plus its weapon's
 * moves, merged into one list. Weapon damage is not an ability - it renders
 * here, above the ability row, alongside `starting_stats` /
 * `standard_level_up_upgrades` changes. Both lists arrive already filtered to
 * player-facing values (derived weapon fields included) - see
 * lib/heroChanges.ts.
 *
 * Reimplements the row shape `deltaRowsFromChanges` builds rather than
 * calling it, because that helper cannot see hero-stat direction
 * (`allProperties` is undefined for the hero path) - `negativeAttribute` has
 * to be resolved per-change here instead.
 */
export function heroStatRows(
	statChanges: Change[],
	weaponChanges: Change[],
): DeltaRow[] {
	return [...statChanges, ...weaponChanges].map(
		({ path, kind, old, new: next }) => ({
			id: path.join("."),
			label: labelForStat(path),
			kind:
				kind === "added" ? "added" : kind === "removed" ? "removed" : "stat",
			old: old as string | number | undefined,
			new: next as string | number | undefined,
			negativeAttribute: isNegativeHeroStat(statKeyOf(path)),
		}),
	);
}
