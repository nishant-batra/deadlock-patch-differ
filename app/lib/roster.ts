// app/lib/roster.ts

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
 * Shared by ingest (which heroes get a hero-changes.json entry) and every
 * roster page - if they disagree, the nav badge stops matching the cards.
 */
export const isLiveHero = ({
	player_selectable,
	disabled,
	in_development,
}: {
	player_selectable?: boolean;
	disabled?: boolean;
	in_development?: boolean;
}) =>
	player_selectable === true && disabled !== true && in_development !== true;

/**
 * An announced hero that is not playable yet. Valve ships these in the catalog
 * with real names, portraits, colours and tags but placeholder everything else
 * (build 6722: six heroes, identical 780-health stat blocks, Infernus' weapon,
 * no abilities), so they are shown as "coming soon" and nothing more.
 *
 * Keyed on the API's own `development_state`, not on `in_development` - Hero
 * Labs and scrapped heroes are `in_development` too, and are not announced.
 * Release flips a hero to live, which ends this by construction, so it moves
 * into the normal roster on its own - at the same `/heroes/$heroSlug` URL.
 */
export const isUpcomingHero = (hero: {
	development_state?: string;
	player_selectable?: boolean;
	disabled?: boolean;
	in_development?: boolean;
}) => hero.development_state === "pre_release" && !isLiveHero(hero);
