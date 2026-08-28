/**
 * The 8 `starting_stats` keys a player actually compares heroes on, out of
 * 23 total. Verified against every live hero: all 23 keys are present on
 * every hero's `starting_stats`, so this is a fixed subset, not a fallback.
 * The rest live behind the card's "All stats" toggle.
 */
export const PRIMARY_STATS = [
	"max_health",
	"weapon_power",
	"light_melee_damage",
	"heavy_melee_damage",
	"base_health_regen",
	"max_move_speed",
	"sprint_speed",
	"stamina",
] as const;
