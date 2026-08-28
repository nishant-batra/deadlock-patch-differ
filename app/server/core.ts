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
import itemsViewJson from "#/data/items-view.json";
import latestDiffJson from "#/data/latest-diff.json";
import type { TierDiff } from "#/lib/abilityUpgrades";
import { type PrunedNode, summarize } from "#/lib/diffEngine";
import { ABILITY_SLOTS } from "#/lib/roster";
import type { AbilityChange, Hero, Item, ItemsView } from "#/types";

export const EMPTY_DIFF: PrunedNode = { added: {}, removed: {}, modified: {} };

export const readItemsView = () => itemsViewJson as unknown as ItemsView;

export const readItemDiff = () => latestDiffJson as unknown as PrunedNode;

/**
 * Joins a hero's four signature/ultimate slots to their ability entries and
 * diffs each against `itemDiff`. Shared by `getChangedHeroes()` (real diff)
 * and `getAllHeroes()` (`EMPTY_DIFF`, so every ability comes back with
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
	itemDiff: PrunedNode,
): AbilityChange[] | undefined {
	const slotClasses = ABILITY_SLOTS.map((slot) => hero.items?.[slot]).filter(
		Boolean,
	);
	const resolved = slotClasses.map((cn) => abilityByClass.get(cn));
	if (resolved.length === 0 || resolved.some((a) => !a)) return undefined;

	return (resolved as Item[]).map((ability) => ({
		ability,
		changes: summarize(itemDiff.modified[ability.name] as PrunedNode),
		// Always three tiers, even unchanged - the popover renders real
		// upgrade content either way.
		tiers: tiersByName[ability.name] ?? [],
	}));
}
