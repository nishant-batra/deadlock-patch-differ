import type { TierDiff, TierRow } from "#/lib/abilityUpgrades";
import { isScaleChange, isStatChange } from "#/lib/diffEngine";
import { abilityDeltaRow } from "#/shared/components/ability-card/utils";
import type { DeltaRow } from "#/shared/components/stat-delta";
import { isNegativeHeroStat, labelForStatKey } from "#/shared/utils/statLabels";
import type { AbilityChange, Change, Item } from "#/types";

export type LedgerSection = {
	ability: Item;
	rows: DeltaRow[];
	tierRows: TierRow[];
};

export type WordingEntry = { ability: Item };

const isTextChange = ({ path }: Change) => path.at(-1) === "loc_string";

/** Upgrade moves the per-tier diff already covers - same split as the popover. */
const isTierCovered = ({ path }: Change) =>
	path[0] === "upgrades" ||
	(path[0] === "description" && /^t\d_desc$/.test(path[1]));

/**
 * A tier blurb ("+150 Damage and +15% Damage Reduction") restates that tier's
 * bonuses, so when a bonus moved the rewrite is just the number again - the
 * tier rows already show it. Only a rewrite with every bonus unchanged is
 * real wording. The popover still shows the text diff either way.
 */
const isTierRewording = ({ text, rows }: TierDiff) =>
	Boolean(text) && rows.every(({ kind }) => kind === "equal");

/**
 * Splits a hero's ability changes into what the card spells out and what it
 * only names. Number moves (property values, spirit scaling, upgrade-tier
 * bonuses) go in `sections`, one per ability, in kit order. Wording rewrites -
 * description and tier text whose bonuses did not move - plus anything else
 * unrecognised go in `wording`, which the card collapses to a single line of
 * ability names. An ability with both lands in both.
 */
export function abilityLedger(abilities: AbilityChange[]) {
	const sections: LedgerSection[] = [];
	const wording: WordingEntry[] = [];

	for (const { ability, changes, tiers } of abilities) {
		const rows = changes
			.filter((change) => isStatChange(change) || isScaleChange(change))
			.map((change) => abilityDeltaRow(change, ability.properties ?? {}));
		const tierRows = tiers.flatMap(({ tier, rows }) =>
			rows
				.filter(({ kind }) => kind !== "equal")
				.map((row) => ({
					...row,
					key: `t${tier}.${row.key}`,
					label: `T${tier} · ${row.label}`,
				})),
		);
		const hasWording =
			changes.some(isTextChange) || tiers.some(isTierRewording);
		const hasOther = changes.some(
			(change) =>
				!isStatChange(change) &&
				!isScaleChange(change) &&
				!isTextChange(change) &&
				!isTierCovered(change),
		);

		if (rows.length || tierRows.length)
			sections.push({ ability, rows, tierRows });
		if (hasWording || hasOther) wording.push({ ability });
	}

	return { sections, wording };
}

/**
 * The `starting_stats` / `standard_level_up_upgrades` / `weapon_info` key a
 * change actually moved.
 *   ['starting_stats','max_health','value']            -> max_health
 *   ['standard_level_up_upgrades','MODIFIER_VALUE_…']  -> MODIFIER_VALUE_…
 *   ['weapon_info','bullet_damage']                    -> bullet_damage
 */
const statKeyOf = (path: string[]) =>
	path.at(-1) === "value" && path.length > 1
		? (path.at(-2) as string)
		: (path.at(-1) as string);

const labelForStat = (path: string[]) => labelForStatKey(statKeyOf(path));

/**
 * The hero card's top strip: the hero's own stat moves plus its weapon's
 * moves, merged into one list. Weapon damage is not an ability - it renders
 * here, above the ability row, alongside `starting_stats` /
 * `standard_level_up_upgrades` changes. Both lists arrive already filtered to
 * player-facing values (derived weapon fields included) - see
 * lib/heroChanges.ts.
 *
 * Reimplements the row shape `deltaRowsFromChanges` builds rather than
 * calling it, because that helper cannot see hero-stat direction
 * (`allProperties` is undefined for the hero path) - `negativeAttribute` has
 * to be resolved per-change here instead.
 */
export function heroStatRows(
	statChanges: Change[],
	weaponChanges: Change[],
): DeltaRow[] {
	return [...statChanges, ...weaponChanges].map(
		({ path, kind, old, new: next }) => ({
			id: path.join("."),
			label: labelForStat(path),
			kind:
				kind === "added" ? "added" : kind === "removed" ? "removed" : "stat",
			old: old as string | number | undefined,
			new: next as string | number | undefined,
			negativeAttribute: isNegativeHeroStat(statKeyOf(path)),
		}),
	);
}
