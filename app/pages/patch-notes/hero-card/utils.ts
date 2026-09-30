import type { DeltaRow } from "#/shared/components/stat-delta";
import { isNegativeHeroStat, labelForStatKey } from "#/shared/utils/statLabels";
import type { Change } from "#/types";

/**
 * The `starting_stats` / `standard_level_up_upgrades` / `weapon_info` key a
 * change actually moved.
 *   ['starting_stats','max_health','value']            -> max_health
 *   ['standard_level_up_upgrades','MODIFIER_VALUE_…']  -> MODIFIER_VALUE_…
 *   ['weapon_info','bullet_damage']                    -> bullet_damage
 */
const statKeyOf = (path: string[]) =>
	path.at(-1) === "value" && path.length > 1
		? (path.at(-2) as string)
		: (path.at(-1) as string);

const labelForStat = (path: string[]) => labelForStatKey(statKeyOf(path));

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
