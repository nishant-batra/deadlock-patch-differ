import {
	type ChangeValue,
	isScaleChange,
	isStatChange,
	statKeyOf,
} from "#/lib/diffEngine";
import { type DeltaRow, deltaDirection } from "#/shared/components/stat-delta";
import { isNegativeProperty } from "#/shared/utils/negativeProperties";
import { scalingIcon } from "#/shared/utils/scaling";
import { humaniseStatKey } from "#/shared/utils/statLabels";
import type { Change, InfoSection, Item, ItemProperty } from "#/types";

/** Property values are scalars; anything else has no delta row to show. */
const scalarOnly = (value: ChangeValue | undefined) =>
	typeof value === "string" || typeof value === "number" ? value : undefined;

/**
 * One `properties.X.value` or `properties.X.scale_function.stat_scale` change
 * as a `StatDelta` row. Shared by the card's hidden-changes panel and the hero
 * card's ability ledger, so both label and colour a move the same way.
 */
export function abilityDeltaRow(
	change: Change,
	allProperties: Item["properties"],
): DeltaRow {
	const { path, kind, old, new: next } = change;
	const key = statKeyOf(change);
	const { label, negative_attribute, prefix, postfix } =
		allProperties[key] ?? {};
	const name = label ?? humaniseStatKey(key);
	const scale = isScaleChange(change);
	return {
		id: path.join("."),
		label: scale ? `${name} Scaling` : name,
		kind: kind === "added" ? "added" : kind === "removed" ? "removed" : "stat",
		old: scalarOnly(old),
		new: scalarOnly(next),
		// AbilityCooldown and siblings carry no `negative_attribute` in the
		// payload at all - see negativeProperties.ts.
		negativeAttribute: negative_attribute ?? isNegativeProperty(key),
		// `stat_scale` is a unitless per-point multiplier, not the property's own
		// displayed value, so the property's "%"/"m" units do not apply to it.
		...(scale ? {} : { prefix, postfix }),
	};
}

/** Every property key one tooltip section renders, big boxes and strip alike. */
export function sectionPropertyKeys(section: InfoSection): string[] {
	return [
		...(section.basic_properties ?? []),
		// Some ability blocks (e.g. The Doorman's Bomb/Luggage Cart, Silver's
		// Lycan Curse) carry a `properties_block` entry with no `properties`
		// array at all - `?? []` on the block itself, not just the outer array.
		...(section.properties_block?.flatMap(
			(block) => block.properties?.map((p) => p.important_property) ?? [],
		) ?? []),
	];
}

const sectionsOf = ({ tooltip_details }: Item) =>
	tooltip_details?.info_sections ?? [];

/** Every property key the tooltip sections render, across all sections. */
export const renderedKeys = (ability: Item) =>
	new Set(sectionsOf(ability).flatMap(sectionPropertyKeys));

/**
 * The cost chips the in-game card puts in its header: range/area/duration
 * under the title, charges and cooldowns in the corner. The game hides the
 * unused ones, which the API sends as `0` (or `-1.0` for "no charge delay").
 */
const CHIP_KEYS = {
	left: ["AbilityCastRange", "Radius", "AbilityDuration"],
	right: ["AbilityCharges", "AbilityCooldownBetweenCharge", "AbilityCooldown"],
} as const;

export function headerChips(ability: Item) {
	const { properties = {} } = ability;
	const inSections = renderedKeys(ability);
	const shown = (keys: readonly string[]) =>
		keys.filter(
			(key) =>
				!inSections.has(key) &&
				Number.parseFloat(String(properties[key]?.value)) > 0,
		);
	return { left: shown(CHIP_KEYS.left), right: shown(CHIP_KEYS.right) };
}

/**
 * Every property key the card face shows. The single definition the card, the
 * hidden-changes panel and "All stats" all read, so they cannot drift apart:
 * anything outside this set is by definition not on the in-game card.
 */
export function faceKeys(ability: Item) {
	const { left, right } = headerChips(ability);
	return new Set([...renderedKeys(ability), ...left, ...right]);
}

/**
 * What a property scales with and by how much. Most entries name their scale
 * stat; a few spirit ones (Scrap Grenade's slow) only say so through the
 * scale function's class name.
 */
export function scalingOf({ scale_function }: ItemProperty) {
	const { stat_scale, specific_stat_scale_type, class_name } =
		scale_function ?? {};
	if (!stat_scale) return undefined;
	const impliedSpirit =
		class_name?.includes("tech") || class_name?.includes("spirit");
	const type =
		specific_stat_scale_type ?? (impliedSpirit ? "ETechPower" : undefined);
	return { scale: stat_scale, icon: scalingIcon(type) };
}

/** Section text rewrites: `tooltip_details.info_sections.N.loc_string`. */
const sectionTextIndex = ({ path }: Change) =>
	path.at(-1) === "loc_string" && path.at(-3) === "info_sections"
		? Number(path.at(-2))
		: undefined;

/** Upgrade moves the per-tier diff already covers. */
const isTierCovered = ({ path }: Change) =>
	path[0] === "upgrades" ||
	(path[0] === "description" && /^t\d_desc$/.test(path[1]));

export type FaceChanges = {
	/** Face property -> its pre-patch value, shown struck before the new one. */
	previous: Map<string, string | number>;
	/** Face property -> its pre-patch scaling multiplier. */
	previousScale: Map<string, string | number>;
	/** Section index -> that section's rewritten text. */
	text: Map<number, Change>;
};

export type HiddenChanges = {
	/** Stat and scaling moves on properties the card does not show. */
	rows: DeltaRow[];
	/** Rewrites of sections the patch removed - no slot left on the card. */
	removedText: Change[];
	/** Everything else that moved: not a stat, not text, not a tier. */
	other: Change[];
};

/**
 * Sorts an ability's changes between the card face (marked in place) and the
 * hidden-changes panel. Pure, so the card and the panel each call it rather
 * than one threading the other's half through.
 */
export function splitAbilityChanges(ability: Item, changes: Change[]) {
	const { properties = {} } = ability;
	const face = faceKeys(ability);
	const sectionCount = sectionsOf(ability).length;
	const shown: FaceChanges = {
		previous: new Map(),
		previousScale: new Map(),
		text: new Map(),
	};
	const hidden: HiddenChanges = { rows: [], removedText: [], other: [] };

	for (const change of changes) {
		if (isTierCovered(change)) continue;
		const stat = isStatChange(change);
		const scale = isScaleChange(change);
		const textIndex = sectionTextIndex(change);
		const old = scalarOnly(change.old);
		// Only an `old -> new` move fits in place; a stat that is new or gone has
		// no "before" to show there, so it goes to the panel as NEW / REMOVED.
		const inPlace =
			change.kind === "modified" &&
			old !== undefined &&
			face.has(statKeyOf(change));

		if (stat && inPlace) shown.previous.set(statKeyOf(change), old);
		else if (scale && inPlace) shown.previousScale.set(statKeyOf(change), old);
		else if (stat || scale)
			hidden.rows.push(abilityDeltaRow(change, properties));
		else if (textIndex !== undefined && textIndex < sectionCount)
			shown.text.set(textIndex, change);
		else if (textIndex !== undefined) hidden.removedText.push(change);
		else hidden.other.push(change);
	}

	return { shown, hidden };
}

/**
 * Whether a face stat's move is a buff or a nerf, judged the same way the
 * change strip judges it so the card's Buff/Nerf tag can never disagree with
 * the row the same move gets anywhere else.
 */
export const faceDirection = (
	key: string,
	{ value, label, negative_attribute }: ItemProperty,
	previous: string | number,
) =>
	deltaDirection({
		id: key,
		label: label ?? key,
		kind: "stat",
		old: previous,
		new: value,
		negativeAttribute: negative_attribute ?? isNegativeProperty(key),
	});
