import { labelForStatKey } from "#/shared/utils/statLabels";
import type { HeroStatScaling, WeaponInfo } from "#/types";

export type DisplayRow = { key: string; label: string; value: string | number };

/** Highest `complexity` in the catalog (Sinclair); everyone else is 1-3. */
export const COMPLEXITY_MAX = 4;

/** Source 2 world units are inches - the game's own "m" readouts divide by this. */
const UNITS_PER_METRE = 39.37;

const round = (value: number, digits = 2) => Number(value.toFixed(digits));
const metres = (units: number) => `${Math.round(units / UNITS_PER_METRE)}m`;

/**
 * The gun stats a player reads off the in-game hero sheet, in that order.
 * `weapon_info` carries ~60 fields; recoil seeds, bullet gravity and the like
 * are tuning internals, not something to compare on. A row whose source field
 * is missing is skipped rather than rendered as a blank.
 */
export function weaponRows({
	bullet_damage,
	bullets,
	damage_per_second,
	damage_per_second_with_reload,
	shots_per_second,
	burst_shot_count,
	clip_size,
	damage_per_magazine,
	reload_duration,
	reload_single_bullets,
	crit_bonus_start,
	damage_falloff_start_range,
	damage_falloff_end_range,
}: WeaponInfo): DisplayRow[] {
	const rows: Array<[key: string, label: string, value: unknown]> = [
		[
			"bullet_damage",
			"Bullet Damage",
			bullet_damage !== undefined &&
				(bullets && bullets > 1
					? `${round(bullet_damage)} × ${bullets} pellets`
					: round(bullet_damage)),
		],
		[
			"damage_per_second",
			"DPS",
			damage_per_second && round(damage_per_second, 1),
		],
		[
			"damage_per_second_with_reload",
			"Sustained DPS (with reload)",
			damage_per_second_with_reload && round(damage_per_second_with_reload, 1),
		],
		[
			"shots_per_second",
			"Fire Rate",
			shots_per_second &&
				`${round(shots_per_second, 1)} shots/s${
					burst_shot_count && burst_shot_count > 1
						? ` (${burst_shot_count}-round bursts)`
						: ""
				}`,
		],
		["clip_size", "Clip Size", clip_size],
		[
			"damage_per_magazine",
			"Damage / Magazine",
			damage_per_magazine && round(damage_per_magazine, 1),
		],
		[
			"reload_duration",
			"Reload Time",
			reload_duration !== undefined &&
				`${round(reload_duration)}s${reload_single_bullets ? " (per bullet)" : ""}`,
		],
		[
			"crit_bonus_start",
			"Headshot Multiplier",
			crit_bonus_start && `×${round(crit_bonus_start)}`,
		],
		[
			"damage_falloff",
			"Damage Falloff",
			damage_falloff_start_range !== undefined &&
				damage_falloff_end_range !== undefined &&
				`${metres(damage_falloff_start_range)} → ${metres(damage_falloff_end_range)}`,
		],
	];

	return rows.flatMap(([key, label, value]) =>
		typeof value === "string" || typeof value === "number"
			? [{ key, label, value }]
			: [],
	);
}

/**
 * `scaling_stats` names stats the game's way (`EClipSize`); these map onto the
 * `starting_stats` / `weapon_info` keys `labelForStatKey` already knows, so the
 * label matches the rest of the page. Anything unmapped (`EFireRate`) drops
 * its `E` and is humanised.
 */
const SCALED_STAT_KEYS: Record<string, string> = {
	EBulletDamage: "bullet_damage",
	EClipSize: "clip_size",
	EMaxMoveSpeed: "max_move_speed",
	ESprintSpeed: "sprint_speed",
	EBaseHealthRegen: "base_health_regen",
	EHeavyMeleeDamage: "heavy_melee_damage",
	EBulletArmorDamageReduction: "bullet_armor_damage_reduction",
	ETechArmorDamageReduction: "tech_armor_damage_reduction",
};

/** What a hero stat scales *with*. Every live hero scales off Spirit Power today. */
const SCALING_SOURCE_LABELS: Record<string, string> = {
	ETechPower: "Spirit Power",
	EWeaponPower: "Weapon Power",
};

/** A display row plus the stat it scales with, for the caller's icon. */
export type ScalingRow = DisplayRow & { scalingStat: string };

export const scalingRows = (
	scalingStats: Record<string, HeroStatScaling>,
): ScalingRow[] =>
	Object.entries(scalingStats).map(([key, { scaling_stat, scale }]) => ({
		key,
		label: labelForStatKey(SCALED_STAT_KEYS[key] ?? key.replace(/^E/, "")),
		value: `+${scale} per ${SCALING_SOURCE_LABELS[scaling_stat] ?? scaling_stat.replace(/^E/, "")}`,
		scalingStat: scaling_stat,
	}));
