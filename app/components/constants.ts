import { ItemSlotType } from "#/types";

export const RESPONSE_CONVERSION_MAP: Record<string, string> = {
	"{s:sign}": "+",
};
export const COLOR_MAP: Record<ItemSlotType, Record<string, string>> = {
	weapon: {
		primary: "#C47820",
		description: "#634222",
		highlight: "#432C16",
	},
	spirit: { primary: "#C364A9", description: "#542E42", highlight: "#39222B" },
	vitality: {
		primary: "#7B912F",
		description: "#494D27",
		highlight: "#30391C",
	},
};
/**
 * Abilities have no `item_slot_type`, and one malformed item must not be able
 * to blank the page - both fall back to this.
 */
export const NEUTRAL: Record<string, string> = {
	primary: "#3A3A47",
	description: "#20202A",
	highlight: "#2A2A36",
};

export const colorsFor = (slot: ItemSlotType | undefined) =>
	(slot && COLOR_MAP[slot]) || NEUTRAL;

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
	// standard_level_up_upgrades
	MODIFIER_VALUE_BASE_BULLET_DAMAGE_FROM_LEVEL: "Bullet Damage / Level",
	MODIFIER_VALUE_BASE_BULLET_DAMAGE_FROM_LEVEL_ALT_FIRE:
		"Alt-Fire Bullet Damage / Level",
	MODIFIER_VALUE_BASE_HEALTH_FROM_LEVEL: "Health / Level",
	MODIFIER_VALUE_BASE_MELEE_DAMAGE_FROM_LEVEL: "Melee Damage / Level",
	MODIFIER_VALUE_BOON_COUNT: "Boon Count",
	MODIFIER_VALUE_BONUS_ATTACK_RANGE: "Bonus Attack Range",
};

const TITLE_CASE = (word: string) =>
	word.length === 0
		? word
		: word[0].toUpperCase() + word.slice(1).toLowerCase();

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

export const itemTypes: Array<ItemSlotType> = [
	ItemSlotType.WEAPON,
	ItemSlotType.SPIRIT,
	ItemSlotType.VITALITY,
];
