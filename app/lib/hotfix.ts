// app/lib/hotfix.ts
//
// hotfix.json keeps every hotfix since the patch apart from the patch itself.
// Its changes are two flat maps over the same keys - each value as it was
// before the first hotfix that touched it, and as it is now:
//
//   before: { "hero/Haze/stats/starting_stats/MaxHealth/value": 500 }
//   after:  { "hero/Haze/stats/starting_stats/MaxHealth/value": 550 }
//
// A key a build touched is on both sides, `null` where the value does not exist
// (an added row has a `null` before, a removed one a `null` after). That is what
// lets two hotfixes merge by spreading alone: the earliest `before` wins, the
// latest `after` wins, and a key whose two sides end up equal - reverted, or
// added then removed - is dropped.
//
// Keys are `/`-joined; no hero, item or property name contains a `/`.
//
//   hero/<hero>/new                                     true
//   hero/<hero>/stats|weapon/<...path>                  the stat's value
//   hero/<hero>/ability/<ability>/<...path>             the property's value or text
//   hero/<hero>/tier/<ability>/<tier>/row/<row key>     { bonus, label, ... }
//   hero/<hero>/tier/<ability>/<tier>/text              the tier's text
//   item/<item>                                         true, or its card data
//   item/<item>/cost | components                       the value
//   item/<item>/<section>/cooldown | text               the value
//   item/<item>/<section>/row/<row key>                 { value, label, ... }

import type {
	DisplayChange,
	HeroChanges,
	Hotfix,
	Item,
	StoredItemChanges,
} from "#/types";
import { diffAbilityTiers, type TierDiff, type TierRow } from "./abilityUpgrades";
import type { Change, ChangeValue } from "./diffEngine";
import { toDiffText } from "./htmlDiff";
import { isEmptyStatValue } from "./statValue";

type Values = Record<string, unknown>;
export type HotfixChanges = Pick<Hotfix, "before" | "after">;

type ItemRow = { value: string | number; label: string };
type TierValue = Omit<TierRow, "key" | "kind" | "old" | "new"> & {
	bonus: string | number;
};

const SEP = "/";

/**
 * The value a key is compared by - the same rules the diffs use: missing and
 * 0 are both nothing, text differing only in markup or casing is the same
 * text, and a component list is compared as a set.
 */
function comparable(key: string, value: unknown): string {
	if (value === null || value === undefined) return "";
	const [scope, , ...rest] = key.split(SEP);
	// An item's own key: present or not, whatever card data it carries.
	if (scope === "item" && rest.length === 0) return "present";
	const last = rest.at(-1);
	if (last === "text" || last === "loc_string") {
		return toDiffText(String(value)).toLowerCase();
	}
	if (Array.isArray(value)) return value.map(String).sort().join("\u0000");
	if (typeof value === "object") {
		const { bonus, value: rowValue } = value as { bonus?: unknown; value?: unknown };
		return comparable(key, bonus ?? rowValue);
	}
	return isEmptyStatValue(value) ? "" : String(value);
}

/** `later` folded onto `earlier`. Spreads, then drops what came back equal. */
export function mergeHotfix(
	earlier: HotfixChanges | undefined,
	later: HotfixChanges,
): HotfixChanges {
	const before = { ...later.before, ...earlier?.before };
	const after = { ...earlier?.after, ...later.after };
	for (const key of Object.keys(after)) {
		if (comparable(key, before[key]) === comparable(key, after[key])) {
			delete before[key];
			delete after[key];
		}
	}
	return { before, after };
}

// --- Writing: one build's diff -> keys -----------------------------------------

/**
 * One build's diff - in the shapes the patch files use - as hotfix keys.
 * `abilityNamesOf` is each hero's ability names, to file tier changes under it.
 */
export function toHotfixChanges(
	items: StoredItemChanges,
	heroes: Record<string, HeroChanges>,
	tiers: Record<string, TierDiff[]>,
	abilityNamesOf: Map<string, string[]>,
): HotfixChanges {
	const before: Values = {};
	const after: Values = {};
	const set = (parts: string[], old: unknown, value: unknown) => {
		const key = parts.join(SEP);
		before[key] = old ?? null;
		after[key] = value ?? null;
	};

	const { added, removed, changed } = items;
	for (const { name } of added) set(["item", name], null, true);
	for (const { name, snapshot } of removed) set(["item", name], snapshot, null);
	for (const { name, changes } of changed) {
		for (const change of changes) {
			switch (change.kind) {
				case "cost":
				case "components":
					set(["item", name, change.kind], change.old, change.new);
					break;
				case "cooldown":
				case "text":
					set(["item", name, change.section, change.kind], change.old, change.new);
					break;
				case "stat": {
					const { section, key, label, old, new: value } = change;
					set(
						["item", name, section, "row", key],
						{ value: old, label },
						{ value, label },
					);
					break;
				}
				case "row-added":
				case "row-removed": {
					const { kind, section, key, ...row } = change;
					set(
						["item", name, section, "row", key],
						kind === "row-removed" ? row : null,
						kind === "row-added" ? row : null,
					);
					break;
				}
			}
		}
	}

	for (const [hero, { stats, weapon, abilities, isNew }] of Object.entries(
		heroes,
	)) {
		if (isNew) set(["hero", hero, "new"], null, true);
		for (const { path, old, new: value } of stats) {
			set(["hero", hero, "stats", ...path], old, value);
		}
		for (const { path, old, new: value } of weapon) {
			set(["hero", hero, "weapon", ...path], old, value);
		}
		for (const [ability, changes] of Object.entries(abilities)) {
			for (const { path, old, new: value } of changes) {
				set(["hero", hero, "ability", ability, ...path], old, value);
			}
		}
		for (const ability of abilityNamesOf.get(hero) ?? []) {
			for (const { tier, rows, text } of tiers[ability] ?? []) {
				const prefix = ["hero", hero, "tier", ability, String(tier)];
				for (const { key, kind, old, new: value, ...display } of rows) {
					if (kind === "equal") continue;
					set(
						[...prefix, "row", key],
						old === undefined ? null : { ...display, bonus: old },
						value === undefined ? null : { ...display, bonus: value },
					);
				}
				if (text) set([...prefix, "text"], text.old, text.new);
			}
		}
	}

	return { before, after };
}

// --- Reading: keys -> the patch files' shapes ----------------------------------

const present = (value: unknown) => (value === null ? undefined : value);

function itemChange(
	path: string[],
	old: unknown,
	value: unknown,
): DisplayChange {
	if (path.length === 1) {
		return path[0] === "cost"
			? { kind: "cost", old: old as number, new: value as number }
			: {
					kind: "components",
					old: (old as string[]) ?? [],
					new: (value as string[]) ?? [],
				};
	}
	const [section, field, key] = path;
	if (field === "cooldown") {
		return {
			kind: "cooldown",
			section,
			old: old as ItemRow["value"],
			new: value as ItemRow["value"],
		};
	}
	if (field === "text") {
		return {
			kind: "text",
			section,
			old: (old as string) ?? "",
			new: (value as string) ?? "",
		};
	}
	if (old && value) {
		const { value: oldValue } = old as ItemRow;
		const { value: newValue, label } = value as ItemRow;
		return { kind: "stat", section, key, label, old: oldValue, new: newValue };
	}
	return value
		? { kind: "row-added", section, key, ...(value as ItemRow) }
		: { kind: "row-removed", section, key, ...(old as ItemRow) };
}

function heroChange(path: string[], old: unknown, value: unknown): Change {
	return {
		path,
		kind:
			old === undefined ? "added" : value === undefined ? "removed" : "modified",
		...(old !== undefined && { old: old as ChangeValue }),
		...(value !== undefined && { new: value as ChangeValue }),
	};
}

/** One tier key laid over the ability's current tiers. */
function applyTier(
	tiers: TierDiff[],
	[tierNumber, field, key]: string[],
	old: unknown,
	value: unknown,
) {
	const tier = tiers.find(({ tier: number }) => String(number) === tierNumber);
	if (!tier) return;
	if (field === "text") {
		tier.text = { old: (old as string) ?? "", new: (value as string) ?? "" };
		return;
	}
	const { bonus: _, ...display } = (value ?? old) as TierValue;
	const row: TierRow = {
		key,
		...display,
		kind: old && value ? "changed" : value ? "added" : "removed",
		...(old !== undefined && { old: (old as TierValue).bonus }),
		...(value !== undefined && { new: (value as TierValue).bonus }),
	};
	const index = tier.rows.findIndex(({ key: rowKey }) => rowKey === key);
	if (index === -1) tier.rows.push(row);
	else tier.rows[index] = row;
}

/**
 * hotfix.json back into the patch files' shapes, so the page renders it with
 * the same code. `abilities` is the current catalog: every ability gets its
 * current tiers, with the hotfix's tier changes laid over them.
 */
export function readHotfix({ before, after }: HotfixChanges, abilities: Item[]) {
	const items: StoredItemChanges = { added: [], removed: [], changed: [] };
	const itemChanges = new Map<string, DisplayChange[]>();
	const heroes: Record<string, HeroChanges> = {};
	const tiers: Record<string, TierDiff[]> = Object.fromEntries(
		abilities.map((ability) => [ability.name, diffAbilityTiers(ability, ability)]),
	);

	for (const key of Object.keys(after)) {
		const old = present(before[key]);
		const value = present(after[key]);
		const [scope, name, ...path] = key.split(SEP);

		if (scope === "item") {
			if (path.length === 0) {
				if (value) items.added.push({ name });
				else items.removed.push({ name, snapshot: old as Item });
			} else {
				const changes = itemChanges.get(name) ?? [];
				changes.push(itemChange(path, old, value));
				itemChanges.set(name, changes);
			}
			continue;
		}

		heroes[name] ??= { stats: [], weapon: [], abilities: {} };
		const hero = heroes[name];
		const [group, ...rest] = path;
		if (group === "new") hero.isNew = true;
		else if (group === "stats") hero.stats.push(heroChange(rest, old, value));
		else if (group === "weapon") hero.weapon.push(heroChange(rest, old, value));
		else {
			const [ability, ...abilityPath] = rest;
			if (group === "tier") {
				if (tiers[ability]) applyTier(tiers[ability], abilityPath, old, value);
			} else {
				hero.abilities[ability] ??= [];
				hero.abilities[ability].push(heroChange(abilityPath, old, value));
			}
		}
	}

	// An added or removed item's card says so; its row moves are not listed.
	const whole = new Set(
		[...items.added, ...items.removed].map(({ name }) => name),
	);
	for (const [name, changes] of itemChanges) {
		if (!whole.has(name)) items.changed.push({ name, changes });
	}

	return { items, heroes, tiers };
}
