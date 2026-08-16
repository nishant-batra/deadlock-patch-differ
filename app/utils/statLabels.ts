/**
 * Hero stat labels. Both `starting_stats` keys and `standard_level_up_upgrades`
 * keys live here (finding #1 - a change can land in either). Anything unseen
 * falls through to `humaniseStatKey`, so an unknown stat still reads sanely.
 */
export const HERO_STAT_LABELS: Record<string, string> = {
	// starting_stats
	max_health: "Max Health",
	max_move_speed: "Move Speed",
	sprint_speed: "Sprint Speed",
	crouch_speed: "Crouch Speed",
	move_acceleration: "Move Acceleration",
	light_melee_damage: "Light Melee Damage",
	heavy_melee_damage: "Heavy Melee Damage",
	health_regen: "Health Regen",
	base_health_regen: "Health Regen",
	bullet_armor_damage_reduction: "Bullet Resist",
	tech_armor_damage_reduction: "Spirit Resist",
	bullet_resist: "Bullet Resist",
	tech_resist: "Spirit Resist",
	stamina: "Stamina",
	stamina_regen_per_second: "Stamina Regen",
	crit_damage_received_scale: "Crit Damage Taken",
	tech_range: "Spirit Range",
	tech_duration: "Spirit Duration",
	reload_speed: "Reload Speed",
	weapon_power: "Weapon Power",
	weapon_power_scale: "Weapon Power Scale",
	proc_build_up_rate_scale: "Proc Build-Up Rate",
	ability_resource_max: "Ability Resource Max",
	ability_resource_regen_per_second: "Ability Resource Regen",
	ground_dash_distance_in_meters: "Ground Dash Distance",
	air_dash_distance_in_meters: "Air Dash Distance",
	// standard_level_up_upgrades
	MODIFIER_VALUE_BASE_BULLET_DAMAGE_FROM_LEVEL: "Bullet Damage / Level",
	MODIFIER_VALUE_BASE_BULLET_DAMAGE_FROM_LEVEL_ALT_FIRE:
		"Alt-Fire Bullet Damage / Level",
	MODIFIER_VALUE_BASE_HEALTH_FROM_LEVEL: "Health / Level",
	MODIFIER_VALUE_BASE_MELEE_DAMAGE_FROM_LEVEL: "Melee Damage / Level",
	MODIFIER_VALUE_BOON_COUNT: "Boon Count",
	MODIFIER_VALUE_BONUS_ATTACK_RANGE: "Bonus Attack Range",
	MODIFIER_VALUE_TECH_RESIST: "Spirit Resist",
	MODIFIER_VALUE_TECH_POWER: "Spirit Power",
	MODIFIER_VALUE_TECH_DAMAGE_MULTIPLIER: "Spirit Damage Multiplier",
	MODIFIER_VALUE_BULLET_ARMOR_DAMAGE_RESIST: "Bullet Resist",
	// weapon_info (surfaced via the weapon's `weapon_info.*` diff, not an
	// ability - see patchService.ts)
	bullet_damage: "Weapon Damage",
	damage_per_second: "DPS",
	damage_per_shot: "Damage / Shot",
	damage_per_magazine: "Damage / Magazine",
	damage_per_second_with_reload: "DPS (with reload)",
	clip_size: "Clip Size",
	bullets_per_second: "Bullets / Second",
	reload_time: "Reload Time",
};

/**
 * Hero/weapon stats where a bigger number is worse - the payload carries no
 * `negative_attribute` for these the way item properties do, so direction has
 * to be hand-maintained. `reload_time` and `crit_damage_received_scale` both
 * hurt when they rise; everything else defaults to "higher is better".
 */
const NEGATIVE_HERO_STATS = new Set([
	"crit_damage_received_scale",
	"reload_time",
]);

export const isNegativeHeroStat = (key: string) => NEGATIVE_HERO_STATS.has(key);

/**
 * All-caps runs are acronyms and are left alone - otherwise `DPS` renders as
 * `Dps`, which shows up on ability upgrade rows.
 */
const TITLE_CASE = (word: string) => {
	if (word.length === 0) return word;
	if (word.length <= 4 && word === word.toUpperCase() && /[A-Z]/.test(word)) {
		return word;
	}
	return word[0].toUpperCase() + word.slice(1).toLowerCase();
};

/**
 * Splits camelCase / PascalCase without breaking up all-caps runs, so both
 * `HealAmpReceivePenaltyPercent` and `BASE_BULLET_DAMAGE` read correctly.
 */
const splitCamelCase = (key: string) =>
	key
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");

export const humaniseStatKey = (key: string) =>
	splitCamelCase(key.replace(/^MODIFIER_VALUE_/, ""))
		.split(/[_\s]+/)
		.filter(Boolean)
		.map(TITLE_CASE)
		.join(" ");

export const labelForStatKey = (key: string) =>
	HERO_STAT_LABELS[key] ?? humaniseStatKey(key);
