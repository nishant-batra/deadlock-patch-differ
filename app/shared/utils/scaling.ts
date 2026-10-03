// app/utils/scaling.ts
//
// Deadlock has four scaling types, each with its own icon on the wiki.
// Scale types seen in the catalog, the non-obvious ones confirmed in game:
// `ETechPower`/`ETechRange` (spirit), `EWeaponPower`/
// `EBaseWeaponDamageIncrease` (weapon), `EHeavyMeleeDamage`/
// `ELightMeleeDamage` (melee). `EMeleePower`/`EBoonCount` are guessed from
// the game's naming convention and not yet observed in the data.
// `scalingIcon` returns `undefined` for anything unrecognised so the caller
// can fall back rather than render nothing.

export type ScalingIconDef = { src: string; label: string };

const SPIRIT: ScalingIconDef = {
	src: "/icons/scaling/spirit.webp",
	label: "Spirit scaling",
};
const WEAPON: ScalingIconDef = {
	src: "/icons/scaling/weapon.webp",
	label: "Weapon scaling",
};
const MELEE: ScalingIconDef = {
	src: "/icons/scaling/melee.webp",
	label: "Melee scaling",
};

const SCALING_ICONS: Record<string, ScalingIconDef> = {
	ETechPower: SPIRIT,
	ETechRange: SPIRIT,
	EWeaponPower: WEAPON,
	EBaseWeaponDamageIncrease: WEAPON,
	EMeleePower: MELEE,
	EHeavyMeleeDamage: MELEE,
	ELightMeleeDamage: MELEE,
	EBoonCount: { src: "/icons/scaling/boon.webp", label: "Boon scaling" },
};

export const scalingIcon = (filter: string | undefined) =>
	filter ? SCALING_ICONS[filter] : undefined;
