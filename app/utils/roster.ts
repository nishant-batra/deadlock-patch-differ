// app/utils/roster.ts

import { type PrunedNode, summarize } from "./diffEngine";

/**
 * Hero ability slots that a hero card renders, plus the pseudo-ability slot
 * that carries weapon changes. Shared by `patchService.ts` and
 * `scripts/ingestPatch.ts` - both need the exact same slots to resolve a
 * hero's abilities the same way.
 *
 * `weapon_primary` resolves to a pseudo-ability (e.g.
 * `citadel_weapon_engineer_set`) - no localised name, no `ability_type`,
 * three permanently empty upgrade tiers, and every hero's weapon icon is the
 * same generic `weapon_damage.png`. It is not an ability; its changes live
 * under `weapon_info.*` on that same entry and are surfaced separately from
 * `abilities` by callers.
 */
export const WEAPON_SLOT = "weapon_primary";
export const ABILITY_SLOTS = [
	"signature1",
	"signature2",
	"signature3",
	"signature4",
];

/**
 * Whether a hero is actually playable in the live game.
 *
 * The catalog ships every hero Valve has in the build, including unreleased and
 * experimental ones - Raven was rendering as a changed hero despite not being in
 * play. Measured on the current catalog of 57:
 *
 *   player_selectable && !disabled && !in_development  -> 38  (the live roster)
 *   !player_selectable                                 -> 14  (Raven, Fathom, Kali, …)
 *   player_selectable && disabled && in_development    ->  5  (Hero Labs: Boho,
 *                                                             Skyrunner, Swan, Graf, Fortuna)
 *
 * Hero Labs heroes are excluded too: `disabled` is the game's own signal that
 * they are not in normal play.
 *
 * Shared by `getChangedHeroes()` and ingest's `countChangedHeroes()` - if the two
 * disagree, the nav badge stops matching the number of cards on screen.
 */
export const isLiveHero = (hero: {
	player_selectable?: boolean;
	disabled?: boolean;
	in_development?: boolean;
}) =>
	hero.player_selectable === true &&
	hero.disabled !== true &&
	hero.in_development !== true;

export interface HeroChangeInput {
	name: string;
	items?: Record<string, string>;
}

/**
 * Whether a hero counts as "changed": one of its resolved abilities has a
 * changed diff entry, its weapon slot does, or its own hero-diff entry does.
 * Returns `false` when any ability slot fails to resolve (currently only
 * Fathom, unreleased) - callers should treat that the same as excluding the
 * hero rather than rendering or counting it half-empty.
 *
 * This is the single source of truth for "is this hero changed" - both
 * `getChangedHeroes()` (patchService.ts) and ingest's `countChangedHeroes()`
 * call it. Previously each reimplemented the rule by hand; if the two ever
 * disagreed, the nav badge would stop matching the number of cards rendered.
 */
export function isHeroChanged(
	hero: HeroChangeInput,
	abilityByClass: Map<string, { name: string }>,
	itemDiff: PrunedNode,
	heroDiff: PrunedNode,
): boolean {
	const slotClasses = ABILITY_SLOTS.map((slot) => hero.items?.[slot]).filter(
		Boolean,
	) as string[];
	const resolved = slotClasses.map((cn) => abilityByClass.get(cn));
	if (resolved.length === 0 || resolved.some((a) => !a)) return false;

	const abilityChanged = (resolved as { name: string }[]).some((ability) => {
		const node = itemDiff.modified[ability.name] as PrunedNode | undefined;
		return node ? summarize(node).length > 0 : false;
	});

	const weaponClass = hero.items?.[WEAPON_SLOT];
	const weaponChanged = weaponClass
		? summarize(itemDiff.modified[weaponClass] as PrunedNode).length > 0
		: false;

	const statChanged =
		summarize(heroDiff.modified[hero.name] as PrunedNode).length > 0;

	return abilityChanged || weaponChanged || statChanged;
}
