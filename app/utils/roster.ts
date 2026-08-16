// app/utils/roster.ts

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
