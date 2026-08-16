// app/utils/abilityUpgrades.ts
//
// Every Deadlock ability has three upgrade tiers, and `upgrades` is the single
// most common ability change in a patch - more common than `properties.*.value`.
// But it is an array, and `calculateDeepDiff` compares arrays with
// JSON.stringify, so the whole thing collapses into one opaque leaf and the card
// could only ever print the bare word "Upgrades".
//
// This decomposes it the same way `tooltipProjection` decomposes items: project
// each tier down to the bonuses it grants, then diff those.
//
// The load-bearing detail is the key. 41 tiers in the catalog repeat a property
// name within a single tier - Powder Keg T3 is
// [ImpactDamage, DPS, AbilityCooldownBetweenCharge, ImpactDamage, DPS] - where
// the repeats are a flat bonus and a spirit-scaling entry. Keying by `name`
// alone silently merges them and loses half the changes.

import type { Item, PropertyUpgrade, Upgrade } from "#/types";
import { humaniseStatKey } from "#/utils/statLabels";
import { prose } from "./tooltipProjection";

/** Abilities always have three tiers; 220 of 278 in the catalog do. */
export const TIERS = [1, 2, 3] as const;
export type TierNumber = (typeof TIERS)[number];

export type TierRow = {
	/** Stable within a tier - see `keyOf`. */
	key: string;
	label: string;
	kind: "equal" | "added" | "removed" | "changed";
	old?: string | number;
	new?: string | number;
	/** e.g. `ETechPower` - the bonus scales with Spirit rather than being flat. */
	scaling?: string;
};

export type TierDiff = {
	tier: TierNumber;
	rows: TierRow[];
	/** A rewrite of this tier's own `t{n}_desc` copy. */
	text?: { old: string; new: string };
};

type Projected = { label: string; bonus: string | number; scaling?: string };

/**
 * `name` is not unique inside a tier. `upgrade_type` (e.g. `EAddToScale`)
 * separates a flat bonus from its scaling twin, and an occurrence counter is the
 * final tiebreak so two genuinely identical entries still map 1:1 by position.
 * `scale_stat_filter` is omitted from the key so adding or updating scaling
 * doesn't break row pairing into a false added+removed pair.
 */
const keyOf = (upgrade: PropertyUpgrade, seen: Map<string, number>) => {
	const base = [upgrade.name, upgrade.upgrade_type ?? ""].join("|");
	const occurrence = seen.get(base) ?? 0;
	seen.set(base, occurrence + 1);
	return `${base}#${occurrence}`;
};

const projectTier = (tier: Upgrade | undefined): Map<string, Projected> => {
	const seen = new Map<string, number>();
	const out = new Map<string, Projected>();
	for (const upgrade of tier?.property_upgrades ?? []) {
		out.set(keyOf(upgrade, seen), {
			label: humaniseStatKey(upgrade.name),
			bonus: upgrade.bonus,
			scaling: upgrade.scale_stat_filter,
		});
	}
	return out;
};

const same = (a: unknown, b: unknown) => String(a) === String(b);

const tierDescription = (item: Item | undefined, tier: TierNumber) =>
	prose(
		(item?.description as Record<string, string> | undefined)?.[
			`t${tier}_desc`
		] ?? "",
	);

/**
 * Three tiers, each with its bonus rows and its own description rewrite.
 *
 * `equal` rows are kept deliberately: an ability with no changes still has to
 * render its real upgrade content rather than an empty state.
 */
export function diffAbilityTiers(
	before: Item | undefined,
	after: Item | undefined,
): TierDiff[] {
	return TIERS.map((tier) => {
		const previous = projectTier(before?.upgrades?.[tier - 1]);
		const current = projectTier(after?.upgrades?.[tier - 1]);
		const rows: TierRow[] = [];

		for (const [key, value] of current) {
			const prior = previous.get(key);
			if (!prior) {
				rows.push({
					key,
					label: value.label,
					kind: "added",
					new: value.bonus,
					scaling: value.scaling,
				});
			} else if (!same(prior.bonus, value.bonus)) {
				rows.push({
					key,
					label: value.label,
					kind: "changed",
					old: prior.bonus,
					new: value.bonus,
					scaling: value.scaling,
				});
			} else {
				rows.push({
					key,
					label: value.label,
					kind: "equal",
					new: value.bonus,
					scaling: value.scaling,
				});
			}
		}

		for (const [key, value] of previous) {
			if (!current.has(key)) {
				rows.push({
					key,
					label: value.label,
					kind: "removed",
					old: value.bonus,
					scaling: value.scaling,
				});
			}
		}

		const oldText = tierDescription(before, tier);
		const newText = tierDescription(after, tier);

		return {
			tier,
			rows,
			text: oldText !== newText ? { old: oldText, new: newText } : undefined,
		};
	});
}

/** True when any tier actually moved - drives the change dot. */
export const hasTierChanges = (tiers: TierDiff[]) =>
	tiers.some(
		(tier) => tier.text || tier.rows.some((row) => row.kind !== "equal"),
	);

/**
 * Collapses a diff down to the ability's current upgrades, dropping the
 * previous-patch comparison entirely - for views like the all-heroes roster
 * that show a hero's kit as it stands today, not what moved last patch.
 * `removed` rows (bonuses that no longer exist) are dropped; everything else
 * becomes an `equal` row carrying only its current value.
 */
export function currentTiers(tiers: TierDiff[]): TierDiff[] {
	return tiers.map((tier) => ({
		tier: tier.tier,
		rows: tier.rows
			.filter((row) => row.kind !== "removed")
			.map((row) => ({
				key: row.key,
				label: row.label,
				kind: "equal" as const,
				new: row.new,
				scaling: row.scaling,
			})),
	}));
}
