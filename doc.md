# Deadlock Patch Differ — how this works, and why

This is a reference for the next person touching this codebase. It explains
the pipeline data flows through, and the reasoning behind a handful of
decisions that aren't obvious just from reading the code.

## 1. Pipeline

```
deadlock-api (raw payload)
        │
        ▼
scripts/ingestPatch.ts   — the only place that ever calls the live API
        │
        ▼
app/data/*.json          — precomputed artifacts, committed to the repo
        │
        ▼
app/server/patchService.ts — reads the artifacts, joins heroes to abilities
        │
        ▼
app/routes/*.tsx         — renders them
```

`ingestPatch.ts` is a script, not a server route: it runs once per patch (by
hand, or on a schedule external to this repo), diffs the new payload against
the previous one, and writes seven files to `app/data/`. Everything under
`app/` reads only those files — nothing in the running app calls the Deadlock
API. This keeps the site fast (no live diffing on every request) and keeps
history: `app/data/*.json` is committed, so `git log` on those files is a
changelog of what the differ itself has shown for each patch.

What each artifact keys on, and why it matters when debugging a missing
change:

| File | Keyed by | Notes |
|---|---|---|
| `heroes-view.json` | — (flat array) | Every hero in the catalog, trimmed to `HERO_VIEW_FIELDS`. Includes unreleased/experimental heroes — filtering them out is the UI's job (`isLiveHero`), not ingest's. |
| `items-view.json` | — (flat arrays: `items`, `abilities`) | Shop items and hero abilities, separately. An ability that didn't change ships as an icon-only *stub* (see §2). |
| `latest-hero-diff.json` | hero **name** | Diff of the hero objects themselves (`starting_stats`, `standard_level_up_upgrades`). Not ability diffs — those are in `latest-diff.json`. |
| `latest-diff.json` | ability/item **name** | The full-payload diff. Ability property/weapon changes live here, keyed by the ability's own `name` — not `class_name`. |
| `ability-tiers.json` | ability **name** | Precomputed per-tier upgrade diffs (see §2 for why this exists at all). Covers all 278 abilities in the catalog, matched by `name` — only 70 of 278 would match by `class_name`, so don't key on that. |
| `item-changes.json` | — (added/removed/changed lists) | Shop item changes only, already projected through `tooltipProjection` — see §2. |
| `patch-meta.json` | — | Version info and the two counts (`items`, `heroes`) shown in the header badge. Computed once at ingest time by predicates that must exactly mirror `patchService.ts`'s (`countChangedHeroes` ↔ `getChangedHeroes`) — if they drift, the badge stops matching the number of cards actually rendered. |

## 2. Why the raw diff isn't shown directly

A naive diff of the API payload is ~67% fields no player can ever see —
internal tuning knobs, editor-only fields, bookkeeping. Three separate
projections exist because items, abilities, and heroes each need a different
one:

- **Items** go through `tooltipProjection.ts` (`diffItems`), which walks the
  same `tooltip_sections` the in-game tooltip renders from, so a change can
  only ever be shown if a player could actually see it. `item-changes.json`
  is this projection's output, precomputed at ingest.
- **Abilities** still run on the raw payload diff (`latest-diff.json`),
  because they carry `upgrades` — an array, and the generic differ
  (`calculateDeepDiff`) compares arrays with `JSON.stringify`, so any change
  anywhere in the array collapses into one opaque "something in upgrades
  changed" leaf. `abilityUpgrades.ts` (`diffAbilityTiers`) decomposes each
  tier into its individual bonus rows first, *then* diffs those — that's
  `ability-tiers.json`. `equal` rows are kept deliberately: an unchanged
  ability still needs to show its real upgrade content, not an empty state
  (this is what makes the all-heroes page possible at all — see §7).
- **Heroes** run on the raw diff too (`summarize()` over
  `latest-hero-diff.json`), because `starting_stats` and
  `standard_level_up_upgrades` are flat enough that the generic differ
  handles them fine.

**Full detail vs. stub abilities.** `ABILITY_FIELDS` (full: properties,
tooltip, description, upgrades) is used only for abilities that changed this
patch; everything else gets `ABILITY_STUB_FIELDS` (icon + name only) to keep
`items-view.json` a manageable size (measured: 3.59 MB → ~1.65 MB). This is
fine for the changed-hero page, where every rendered ability *did* change.
It's a real limitation on the all-heroes page (`/heroes`): an unchanged
ability's popover shows its name and its real tiers (from
`ability-tiers.json`, unaffected by the stub/full split) but no description,
because the stub has none. Fixing this means adding `description` to
`ABILITY_STUB_FIELDS` and re-running ingest — deliberately left out of this
change; flagged here so it isn't rediscovered as a "bug."

## 3. Weapon damage is not an ability

Every hero's `items.weapon_primary` slot resolves to an entry like
`citadel_weapon_engineer_set` — but it isn't a real ability. Verified against
the current catalog: all 56 of these share the same generic
`weapon_damage.png` icon, have no localised `name` distinct from their
`class_name`, no `ability_type`, and their `ability-tiers.json` entry is
three permanently empty tiers. Their actual content is a `weapon_info.*`
diff — `bullet_damage`, `damage_per_second`, and three fields derived from
those two (`damage_per_shot`, `damage_per_magazine`,
`damage_per_second_with_reload`, all filtered out by a denylist in
`hero-card/utils.ts` since they're the same nerf/buff restated three times).

`patchService.ts` splits `SLOTS` into `WEAPON_SLOT` (the pseudo-ability) and
`ABILITY_SLOTS` (the four real signature/ultimate slots) and surfaces the
weapon's changes as `weaponChanges`, merged into the same top-of-card strip
as `statChanges` (`hero-card/utils.ts`'s `heroStatRows`) — never as a
clickable ability icon. `scripts/ingestPatch.ts`'s `countChangedHeroes`
mirrors this split exactly; verified it doesn't change the "heroes changed"
count for the patch this was built against (13, same 13 names, before and
after).

## 4. Each change is stated once — chip or orphan strip

Before this change, a moved property was shown twice: once as an `old → new`
row in a `StatDelta` strip, and again as a bare, unannotated value on its
tooltip chip. The fix is that **the chip is the source of truth** — when a
changed property has a chip to render on (i.e. it appears in the ability's
`tooltip_details.info_sections` or the item's `tooltip_sections`), its delta
renders there, inline, via `PropertyList`'s `previousValues` prop (a
`Map<propertyKey, oldValue>`). The old top-of-popover strip is now the
**orphan channel**: it only renders changes that have *nowhere* to go —
measured on the patch this was built against, that's the majority case (5 of
9 changed ability properties had no chip at all: Mini Turret's
`DecayingResist`/`DecayingResistDuration`, Petrifying Bola's
`Radius`/`PetrifyDuration`, Stalker's Mark's `AbilityCooldown`). Don't treat
the strip as a rare fallback when reasoning about coverage — it's load-bearing.

The contract: `renderedKeys(sections)` (in `ability-popover/utils.ts` and
`item-card/utils.ts`, one implementation per source shape) returns every
property key the tooltip actually renders. A changed key inside that set
gets its delta inlined; a changed key outside it goes to the strip.
`AbilityCooldown` is deliberately excluded from `item-card`'s `renderedKeys`
— it's drawn separately as the section-bar pill, never through
`PropertyList`, so including it would silently swallow its delta.

**Direction colouring gap.** `negative_attribute` — the payload's own "bigger
is worse" flag — is present on only 19 properties catalog-wide, and is
absent from `AbilityCooldown`, `AbilityCastDelay`, and `AbilityChannelTime`
entirely, despite a longer cooldown always being a nerf. Verified: before
this fix, a cooldown increase rendered green. `negativeProperties.ts`
(`isNegativeProperty`) and `statLabels.ts`'s `isNegativeHeroStat` are the
override, consulted only when the payload itself has no
`negative_attribute` — never overriding an explicit flag. `AbilityDuration`
is deliberately *not* in this list: it's often a buff's own duration, where
longer is better, so guessing a direction for it would be wrong as often as
right.

## 5. Popover positioning

The ability popover used to render `position: absolute` inside the card's
`relative <li>`, reasoning that an out-of-flow element couldn't affect
layout. Measured otherwise: `.masonary` (the card grid) is a CSS multi-column
container, and browsers fragment absolutely-positioned descendants of a
multicol box and re-run column balancing around them — opening a popover on
one card visibly shifted every card below it in that column (measured: a
210px jump, one column over). Two smaller bugs compounded it: `flip`
(horizontal-only edge detection) was computed in a `useEffect`, which runs
*after* paint, so a right-edge popover flashed left-aligned for one frame;
and the dialog's `z-1` sat under the sticky nav's `z-10`.

The fix: the dialog is rendered through `createPortal` into `document.body`
and positioned with `position: fixed`, measured from the button that opened
it (`anchorRef`, tracked per-ability in `ability-row/useOpenAbility.ts`) in a
`useLayoutEffect` — which runs before paint, so there's no flash. It's
clamped to the viewport on both axes and recomputed on scroll/resize. Being
portalled removes it from the multicol box entirely; being `fixed` removes it
from document flow entirely, so it can no longer add scroll height or push
anything else.

`onClose` is read through a ref inside the hook rather than being a
`useEffect` dependency. Its identity changes every render (`useOpenAbility`
recreates the closure each time), and — separately — `anchorRefFor` also
returns a new wrapper object every render, so including either as a
dependency would re-run the effect (and re-attach its listeners) constantly.
Reading through a ref, and reading `.current` fresh inside the effect body
rather than capturing it, sidesteps the staleness the lint rule exists to
catch. Worth knowing given `babel-plugin-react-compiler` is enabled — its
memoization doesn't change this analysis, since the fix isn't about identity
stability, it's about *when* the current value is read.

## 6. Scaling icons

A tier row's bonus can scale with a stat (spirit/weapon/melee/boon) rather
than being flat — `scale_stat_filter` on the upgrade entry. `utils/scaling.ts`
maps the filter to an icon: `ETechPower` → spirit (confirmed: this is the
only filter value present anywhere in the current catalog, 8 occurrences),
`EWeaponPower` → weapon, `EMeleePower` → melee, `EBoonCount` → boon — the
latter three are guessed from Deadlock's own naming convention, not yet
observed in the data. `ScalingIcon` (`components/scaling-icon/`) falls back
to the old `✦` glyph with the raw filter string as its `title` for anything
unrecognised, so an unanticipated filter value never renders blank.

The four icon files (`public/icons/scaling/*.webp`) are the only local image
assets in the repo — everything else (hero portraits, ability icons, item
icons) is a remote `assets-bucket.deadlock-api.com` URL taken verbatim from
the payload. They came from `deadlock.wiki`, which sits behind a Cloudflare
bot challenge that blocks direct `curl`/server-side fetches; they were
fetched through an actual browser session (which passes the JS challenge)
and saved from there.

**Open follow-up, not built here:** item/ability property chips also carry a
`scale_function.specific_stat_scale_type` (e.g. `DoorwayDistance` scales with
`ETechPower`), which today renders no icon at all. The same `ScalingIcon`
component could apply there too.

## 7. Roster filtering

`utils/roster.ts`'s `isLiveHero` — `player_selectable && !disabled &&
!in_development` — is the single source of truth for "is this hero actually
in the game." The catalog ships unreleased heroes (Raven, Fathom, Kali, …)
and Hero Labs experiments (Boho, Skyrunner, Swan, Graf, Fortuna) alongside
the live roster of 38. `getChangedHeroes()`, `getAllHeroes()`, and
`ingestPatch.ts`'s `countChangedHeroes()` all call the same predicate — if
any of them diverges, the header's "N heroes changed" badge stops matching
the number of cards actually on screen. When adding a new heroes-related
function, filter through `isLiveHero`, not a hand-rolled equivalent.

## 8. Known rough edges

- **`app/utils/tooltipProjection.ts` contains a stray NUL byte** somewhere in
  the file. `ripgrep` (and the `Grep` tool built on it) classifies the whole
  file as binary and silently skips it — a plain-text search that should
  match something in this file and doesn't isn't proof the code isn't there;
  read the file directly instead.
- **`patch-meta.json`'s counts are computed once, at ingest time.** Changing
  what counts as "this hero changed" (as this change did, splitting out the
  weapon) doesn't retroactively update already-ingested data — it only
  changes what the *next* ingest run produces. Re-verify the count matches
  after any predicate change, the way §3 was checked against the current
  data (13 before, 13 after, same names) rather than assumed safe.
