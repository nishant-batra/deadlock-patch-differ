// app/utils/scaling.ts
//
// Deadlock has four scaling types, each with its own icon on the wiki. Only
// `ETechPower` (spirit) appears in `scale_stat_filter` in the current catalog
// (8 occurrences) - the other three keys are forward-looking, guessed from
// the game's own naming convention (`ETechPower` -> spirit is confirmed;
// `EWeaponPower`/`EMeleePower`/`EBoonCount` are not yet observed in the data).
// `scalingIcon` returns `undefined` for anything unrecognised so the caller
// can fall back rather than render nothing.

export type ScalingIconDef = { src: string; label: string };

export const SCALING_ICONS: Record<string, ScalingIconDef> = {
	ETechPower: { src: "/icons/scaling/spirit.webp", label: "Spirit scaling" },
	EWeaponPower: { src: "/icons/scaling/weapon.webp", label: "Weapon scaling" },
	EMeleePower: { src: "/icons/scaling/melee.webp", label: "Melee scaling" },
	EBoonCount: { src: "/icons/scaling/boon.webp", label: "Boon scaling" },
};

export const scalingIcon = (filter: string | undefined) =>
	filter ? SCALING_ICONS[filter] : undefined;
