import type { DeltaRow } from "#/components/stat-delta";
import type { Change } from "#/types";
import { isNegativeHeroStat, labelForStatKey } from "#/utils/statLabels";

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

export const labelForStat = (path: string[]) =>
	labelForStatKey(statKeyOf(path));

/**
 * Five `weapon_info` fields all restate one `bullet_damage` nerf
 * (`damage_per_shot`, `damage_per_magazine`, `damage_per_second_with_reload`
 * are all derived from `bullet_damage` and `damage_per_second`). A denylist,
 * not an allowlist, so an unknown weapon field is never silently swallowed.
 */
const DERIVED_WEAPON_KEYS = new Set([
	"damage_per_shot",
	"damage_per_magazine",
	"damage_per_second_with_reload",
]);

/**
 * The hero card's top strip: the hero's own stat moves plus its weapon's
 * moves, merged into one list. Weapon damage is not an ability - it renders
 * here, above the ability row, alongside `starting_stats` /
 * `standard_level_up_upgrades` changes (see patchService.ts).
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
	const changes = [
		...statChanges,
		...weaponChanges.filter(
			(change) => !DERIVED_WEAPON_KEYS.has(change.path.at(-1) as string),
		),
	];

	return changes.map((change) => ({
		id: change.path.join("."),
		label: labelForStat(change.path),
		kind:
			change.kind === "added"
				? "added"
				: change.kind === "removed"
					? "removed"
					: "stat",
		old: change.old as string | number | undefined,
		new: change.new as string | number | undefined,
		negativeAttribute: isNegativeHeroStat(statKeyOf(change.path)),
	}));
}
