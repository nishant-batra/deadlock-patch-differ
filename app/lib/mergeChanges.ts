// app/lib/mergeChanges.ts
//
// Folds a hotfix's changes into the ones already on the page (see
// patchWindow.ts for when that happens). No pre-patch snapshot is kept: every
// change already records its old and new value, so two consecutive changes to
// the same stat compose into one:
//
//   on the page    hotfix        result
//   -              10 -> 8       10 -> 8
//   10 -> 8        -             10 -> 8
//   10 -> 8        8 -> 9        10 -> 9      one row, not two
//   10 -> 8        8 -> 10       (dropped)    reverted
//   new: 5         5 -> 6        new: 6
//   new: 5         removed       (dropped)
//   removed (5)    new: 5        (dropped)
//
// Everything below is that one rule - `composeSteps` - applied to each of the
// three change shapes the page renders.

import type { DisplayChange, HeroChanges, Item } from "#/types";
import { hasTierChanges, type TierDiff, type TierRow } from "./abilityUpgrades";
import type { Change, ChangeValue } from "./diffEngine";
import { isEmptyStatValue } from "./statValue";
import { diffItems, prose } from "./tooltipProjection";

/** `undefined` is "absent": the stat did not exist on that side. */
type Value = ChangeValue | undefined;
type Step = { id: string; before: Value; after: Value };

/** item-changes.json as ingest writes it. */
export type StoredItemChanges = {
	added: Array<{ name: string }>;
	removed: Array<{ name: string; snapshot: Item }>;
	changed: Array<{ name: string; changes: DisplayChange[] }>;
};

const normalise = (value: Value) =>
	value !== null && typeof value === "object"
		? JSON.stringify(value)
		: prose(String(value)).toLowerCase();

/**
 * Same rules the diffs themselves use: missing and 0 are both "nothing", and
 * text differing only in markup or casing is the same text.
 */
export const sameValue = (a: Value, b: Value) =>
	(isEmptyStatValue(a) && isEmptyStatValue(b)) ||
	(a !== undefined && b !== undefined && normalise(a) === normalise(b));

/**
 * `first` is on the page, `second` is the hotfix. A change both touch keeps
 * `first`'s before and `second`'s after, and disappears when those are equal;
 * the rest pass through. Page order is kept, new changes go last.
 */
function composeSteps<C>(
	first: C[],
	second: C[],
	stepOf: (change: C) => Step,
	rebuild: (latest: C, before: Value, after: Value) => C,
): C[] {
	const hotfix = new Map(
		second.map((change) => [stepOf(change).id, change] as const),
	);
	const out: C[] = [];
	for (const change of first) {
		const { id, before } = stepOf(change);
		const latest = hotfix.get(id);
		if (!latest) {
			out.push(change);
			continue;
		}
		hotfix.delete(id);
		const { after } = stepOf(latest);
		if (!sameValue(before, after)) out.push(rebuild(latest, before, after));
	}
	out.push(...hotfix.values());
	return out;
}

// --- Hero stats, weapon and ability properties ------------------------------

const heroStep = ({ path, kind, old, new: value }: Change): Step => ({
	id: path.join("\u0000"),
	before: kind === "added" ? undefined : old,
	after: kind === "removed" ? undefined : value,
});

const rebuildHeroChange = (
	{ path }: Change,
	before: Value,
	after: Value,
): Change =>
	before === undefined
		? { path, kind: "added", new: after }
		: after === undefined
			? { path, kind: "removed", old: before }
			: { path, kind: "modified", old: before, new: after };

export const mergeChangeLists = (first: Change[], second: Change[]) =>
	composeSteps(first, second, heroStep, rebuildHeroChange);

// --- Item tooltips ------------------------------------------------------------

function displayStep(change: DisplayChange): Step {
	switch (change.kind) {
		// One id for all three: a row removed on the page and re-added by the
		// hotfix is a stat change (or nothing), not two rows.
		case "stat":
			return rowStep(change, change.old, change.new);
		case "row-added":
			return rowStep(change, undefined, change.value);
		case "row-removed":
			return rowStep(change, change.value, undefined);
		case "cooldown":
			return {
				id: `cooldown\u0000${change.section}`,
				before: change.old,
				after: change.new,
			};
		case "cost":
			return { id: "cost", before: change.old, after: change.new };
		case "text":
			return {
				id: `text\u0000${change.section}`,
				before: change.old,
				after: change.new,
			};
		case "components":
			return { id: "components", before: change.old, after: change.new };
	}
}

const rowStep = (
	{ section, key }: { section: string; key: string },
	before: Value,
	after: Value,
): Step => ({ id: `row\u0000${section}\u0000${key}`, before, after });

type Scalar = string | number;

function rebuildDisplayChange(
	latest: DisplayChange,
	before: Value,
	after: Value,
): DisplayChange {
	switch (latest.kind) {
		case "stat":
		case "row-added":
		case "row-removed": {
			const { section, key, label } = latest;
			if (before === undefined) {
				return {
					kind: "row-added",
					section,
					key,
					label,
					value: after as Scalar,
				};
			}
			if (after === undefined) {
				return {
					kind: "row-removed",
					section,
					key,
					label,
					value: before as Scalar,
				};
			}
			return {
				kind: "stat",
				section,
				key,
				label,
				old: before as Scalar,
				new: after as Scalar,
			};
		}
		case "cooldown":
			return {
				kind: "cooldown",
				section: latest.section,
				old: before as Scalar | undefined,
				new: after as Scalar | undefined,
			};
		case "cost":
			return {
				kind: "cost",
				old: before as number | undefined,
				new: after as number | undefined,
			};
		case "text":
			return {
				kind: "text",
				section: latest.section,
				old: (before ?? "") as string,
				new: (after ?? "") as string,
			};
		case "components":
			return {
				kind: "components",
				old: (before ?? []) as string[],
				new: (after ?? []) as string[],
			};
	}
}

export const mergeDisplayChanges = (
	first: DisplayChange[],
	second: DisplayChange[],
) => composeSteps(first, second, displayStep, rebuildDisplayChange);

/**
 * Item membership composes like a value does: added then removed is nothing,
 * removed then added is whatever differs from the removed snapshot, and an item
 * added this window stays "new" - its card already shows current values.
 */
export function mergeItemChanges(
	first: StoredItemChanges,
	second: StoredItemChanges,
	currentByName: Map<string, Item>,
): StoredItemChanges {
	const added = new Map(first.added.map((entry) => [entry.name, entry]));
	const removed = new Map(first.removed.map((entry) => [entry.name, entry]));
	const changed = new Map(
		first.changed.map(({ name, changes }) => [name, changes]),
	);

	for (const entry of second.added) {
		const { name } = entry;
		const gone = removed.get(name);
		if (!gone) {
			added.set(name, entry);
			continue;
		}
		removed.delete(name);
		const current = currentByName.get(name);
		const changes = current ? diffItems(gone.snapshot, current) : [];
		if (changes.length > 0) changed.set(name, changes);
	}

	for (const entry of second.removed) {
		const { name } = entry;
		if (added.delete(name)) continue;
		changed.delete(name);
		// Its snapshot is the hotfix's pre-state, which already includes this
		// window's earlier changes - the only copy there is.
		removed.set(name, entry);
	}

	for (const { name, changes } of second.changed) {
		if (added.has(name)) continue;
		const merged = mergeDisplayChanges(changed.get(name) ?? [], changes);
		if (merged.length > 0) changed.set(name, merged);
		else changed.delete(name);
	}

	return {
		added: [...added.values()],
		removed: [...removed.values()],
		changed: [...changed].map(([name, changes]) => ({ name, changes })),
	};
}

// --- Ability upgrade tiers ------------------------------------------------------

/** A row's value before its change; `equal` rows only carry `new`. */
const rowBefore = ({ kind, old, new: value }: TierRow): Value =>
	kind === "added" ? undefined : kind === "equal" ? value : old;

function mergeTier(first: TierDiff | undefined, second: TierDiff): TierDiff {
	const earlier = new Map(first?.rows.map((row) => [row.key, row]));
	const rows: TierRow[] = [];

	for (const row of second.rows) {
		const { key, kind, new: value } = row;
		const prior = earlier.get(key);
		earlier.delete(key);
		const before = rowBefore(prior ?? row);
		const after = kind === "removed" ? undefined : value;
		// Added on the page, removed by the hotfix: it never existed.
		if (before === undefined && after === undefined) continue;

		const values: Pick<TierRow, "kind" | "old" | "new"> =
			before === undefined
				? { kind: "added", new: after as Scalar }
				: after === undefined
					? { kind: "removed", old: before as Scalar }
					: sameValue(before, after)
						? { kind: "equal", new: after as Scalar }
						: { kind: "changed", old: before as Scalar, new: after as Scalar };
		// Same field order as `diffAbilityTiers`, so a merge that changes nothing
		// rewrites the file byte for byte.
		const { label, scaling, prefix, postfix } = row;
		rows.push({ key, label, ...values, scaling, prefix, postfix });
	}
	// Only rows removed earlier in the window are left: the hotfix never saw them.
	rows.push(...earlier.values());

	const before = first?.text ? first.text.old : second.text?.old;
	const after = second.text ? second.text.new : first?.text?.new;
	const text =
		before !== undefined && after !== undefined && before !== after
			? { old: before, new: after }
			: undefined;

	return { tier: second.tier, rows, text };
}

/**
 * ability-tiers.json doubles as every ability's current upgrade list, so an
 * ability the hotfix did not touch still gets merged: its all-`equal` hotfix
 * rows carry the page's earlier changes forward unchanged.
 */
export function mergeAbilityTiers(
	first: Record<string, TierDiff[]>,
	second: Record<string, TierDiff[]>,
): Record<string, TierDiff[]> {
	const out = { ...first };
	for (const [name, tiers] of Object.entries(second)) {
		const earlier = new Map(first[name]?.map((tier) => [tier.tier, tier]));
		out[name] = tiers.map((tier) => mergeTier(earlier.get(tier.tier), tier));
	}
	return out;
}

// --- Heroes -------------------------------------------------------------------

const EMPTY_HERO: HeroChanges = { stats: [], weapon: [], abilities: {} };

/**
 * A hero stays on the page while any of its changes survive the merge -
 * including tier-only changes, which is why the merged tiers and each hero's
 * ability names are passed in.
 */
export function mergeHeroChanges(
	first: Record<string, HeroChanges>,
	second: Record<string, HeroChanges>,
	tiersByName: Record<string, TierDiff[]>,
	abilityNamesOf: Map<string, string[]>,
): Record<string, HeroChanges> {
	const out: Record<string, HeroChanges> = {};
	const names = new Set([...Object.keys(first), ...Object.keys(second)]);

	for (const name of names) {
		const earlier = first[name] ?? EMPTY_HERO;
		const hotfix = second[name] ?? EMPTY_HERO;

		const abilities: Record<string, Change[]> = {};
		const abilityNames = new Set([
			...Object.keys(earlier.abilities),
			...Object.keys(hotfix.abilities),
		]);
		for (const ability of abilityNames) {
			const changes = mergeChangeLists(
				earlier.abilities[ability] ?? [],
				hotfix.abilities[ability] ?? [],
			);
			if (changes.length > 0) abilities[ability] = changes;
		}
		const stats = mergeChangeLists(earlier.stats, hotfix.stats);
		const weapon = mergeChangeLists(earlier.weapon, hotfix.weapon);

		const tiersChanged = (abilityNamesOf.get(name) ?? []).some((ability) =>
			hasTierChanges(tiersByName[ability] ?? []),
		);
		if (
			stats.length > 0 ||
			weapon.length > 0 ||
			tiersChanged ||
			Object.keys(abilities).length > 0
		) {
			out[name] = { stats, weapon, abilities };
		}
	}
	return out;
}
