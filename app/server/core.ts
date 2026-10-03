// app/server/core.ts
//
// Low-level readers shared by getChangedHeroes() (pages/patch-notes/server.ts)
// and getAllHeroes() (server/heroes.ts) - two independent per-page/shared
// query modules that both need to join a hero's abilities against the item
// catalog, so the join itself lives here instead of in either one.
//
// These are static imports, not runtime fs reads: Vercel's serverless bundler
// can only trace files reached through real imports, not a dynamically-built
// fs path, so a fs.readFileSync(path.join(DATA_DIR, file)) here silently
// finds nothing in production. A new commit to app/data already triggers a
// fresh Vercel build (that's what the ingest cron is for), so bundling the
// JSON at build time costs nothing over reading it at request time.
import heroChangesJson from "#/data/hero-changes.json";
import itemChangesJson from "#/data/item-changes.json";
import itemsViewJson from "#/data/items-view.json";
import type { TierDiff } from "#/lib/abilityUpgrades";
import { ABILITY_SLOTS } from "#/lib/roster";
import type { DisplayChange } from "#/lib/tooltipProjection";
import type {
	AbilityChange,
	Change,
	Hero,
	HeroChanges,
	Item,
	ItemsView,
} from "#/types";

export const readItemsView = () => itemsViewJson as unknown as ItemsView;

/** Hero name -> its filtered changes (lib/heroChanges.ts). Present iff changed. */
export const readHeroChanges = () =>
	heroChangesJson as unknown as Record<string, HeroChanges>;

type RawItemChanges = {
	changed: Array<{ name: string; changes: DisplayChange[] }>;
};

/**
 * Item name -> its display-level change list, straight from the same
 * precomputed diff `getItemChanges()` (pages/patch-notes/server.ts) joins
 * against the catalog for the Changes page - shared so `/items`
 * (pages/items/server.ts) can attach the same changes to its catalog cards
 * without re-deriving them.
 */
export function itemChangesByName(): Map<string, DisplayChange[]> {
	const { changed } = itemChangesJson as unknown as RawItemChanges;
	return new Map(changed.map(({ name, changes }) => [name, changes]));
}

/**
 * Joins a hero's four signature/ultimate slots to their ability entries and
 * attaches each one's precomputed changes. Shared by `getChangedHeroes()` and
 * `getAllHeroes()` (an empty record, so every ability comes back with
 * `changes: []` and its real three tiers - `diffAbilityTiers` keeps `equal`
 * rows on purpose so the popover still shows genuine upgrade content).
 *
 * Returns `undefined` when a slot fails to resolve (currently only Fathom,
 * unreleased) - the caller drops the hero rather than rendering it half-empty.
 */
export function joinAbilities(
	hero: Hero,
	abilityByClass: Map<string, Item>,
	tiersByName: Record<string, TierDiff[]>,
	changesByAbility: Record<string, Change[]>,
): AbilityChange[] | undefined {
	const slotClasses = ABILITY_SLOTS.map((slot) => hero.items?.[slot]).filter(
		Boolean,
	);
	const resolved = slotClasses.map((cn) => abilityByClass.get(cn));
	if (resolved.length === 0 || resolved.some((a) => !a)) return undefined;

	return (resolved as Item[]).map((ability) => {
		const { name } = ability;
		return {
			ability,
			changes: changesByAbility[name] ?? [],
			// Always three tiers, even unchanged - the popover renders real
			// upgrade content either way.
			tiers: tiersByName[name] ?? [],
		};
	});
}
