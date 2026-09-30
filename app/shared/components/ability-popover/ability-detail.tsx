import { isScaleChange, isStatChange, statKeyOf } from "#/lib/diffEngine";
import { NEUTRAL } from "#/shared/components/item-card/constants";
import PropertyList from "#/shared/components/property-list";
import StatDelta, { type DeltaRow } from "#/shared/components/stat-delta";
import { isNegativeProperty } from "#/shared/utils/negativeProperties";
import { humaniseStatKey } from "#/shared/utils/statLabels";
import type { Change, Item } from "#/types";
import { renderedKeys, sectionPropertyKeys } from "./utils";

const OTHER_LIMIT = 4;

/**
 * Everything that moved on an ability but is not a displayable
 * `properties.X.value` stat. Abilities still run on the raw payload diff, so
 * this summarises the remainder rather than spelling it out; the full detail is
 * in the body below. Items no longer need this - their changes come from the
 * tooltip projection, which cannot emit anything invisible in the first place.
 */
function OtherChanges({ changes }: { changes: Change[] }) {
	if (changes.length === 0) return null;
	const shown = changes.slice(0, OTHER_LIMIT);
	return (
		<div className="px-2 py-1 text-gray-400 text-xs">
			{shown.map(({ path, kind }) => (
				<span key={path.join(".")} className="mr-2 inline-block">
					{humaniseStatKey(path.at(-1) ?? "")}
					{kind !== "modified" ? ` (${kind})` : ""}
				</span>
			))}
			{changes.length > shown.length && (
				<span>+{changes.length - shown.length} more</span>
			)}
		</div>
	);
}

/**
 * A second renderer is unavoidable: shop items carry `tooltip_sections`,
 * abilities carry `tooltip_details.info_sections`, and no item has both.
 * Abilities also have no `item_slot_type`, so `ItemCard`'s colour lookup does
 * not apply. The property-resolution logic itself is reused via `PropertyList`.
 */
export default function AbilityDetail({
	item,
	changes,
}: {
	item: Item;
	changes: Change[];
}) {
	const statChanges = changes.filter(isStatChange);
	const scaleChanges = changes.filter(isScaleChange);
	const { tooltip_details, properties: allProperties = {}, description } = item;
	const sections = tooltip_details?.info_sections ?? [];

	// Every changed key with a chip gets its delta rendered there instead
	// (PropertyList's `previousValues`) - only orphans, changed keys the
	// tooltip renders nowhere, still need the strip. Measured on the current
	// patch: 5 of 9 changed ability properties are orphans, so this is the
	// majority path, not a rare fallback.
	const inlined = renderedKeys(sections);
	// Only an `old -> new` move fits on a chip; a stat that is new or gone has
	// no "before" to show inline, so it goes to the strip as NEW / REMOVED.
	const isInlined = (change: Change) =>
		change.kind === "modified" && inlined.has(statKeyOf(change));
	const previousValues = new Map(
		statChanges
			.filter(isInlined)
			.map((change) => [statKeyOf(change), change.old as string | number]),
	);
	const orphanRows: DeltaRow[] = statChanges
		.filter((change) => !isInlined(change))
		.map((change) => {
			const { path, kind, old, new: next } = change;
			const key = statKeyOf(change);
			const { label, negative_attribute, prefix, postfix } =
				allProperties[key] ?? {};
			return {
				id: path.join("."),
				label: label ?? humaniseStatKey(key),
				kind:
					kind === "added" ? "added" : kind === "removed" ? "removed" : "stat",
				old: old as string | number | undefined,
				new: next as string | number | undefined,
				// AbilityCooldown and siblings carry no `negative_attribute` in the
				// payload at all - see negativeProperties.ts.
				negativeAttribute: negative_attribute ?? isNegativeProperty(key),
				prefix,
				postfix,
			};
		});

	// The property's own `value` never moves here - only the multiplier it
	// scales with (e.g. spirit power) did - so this can never be inlined onto
	// the tooltip chip the way a `.value` change is; it always needs its own row.
	const scaleRows: DeltaRow[] = scaleChanges.map((change) => {
		const { path, old, new: next } = change;
		const key = statKeyOf(change);
		const { label, negative_attribute } = allProperties[key] ?? {};
		return {
			id: path.join("."),
			label: `${label ?? humaniseStatKey(key)} Scaling`,
			kind: "stat",
			old: old as string | number | undefined,
			new: next as string | number | undefined,
			negativeAttribute: negative_attribute ?? isNegativeProperty(key),
			// No prefix/postfix here on purpose - `stat_scale` is a unitless
			// per-point multiplier, not the property's own displayed value, so the
			// property's "%"/"m" postfix does not apply to it.
		};
	});

	return (
		<div
			className="mt-2 flex flex-col gap-1 rounded-md p-2"
			style={{ background: NEUTRAL.description }}
		>
			{(orphanRows.length > 0 || scaleRows.length > 0) && (
				<div
					className="flex flex-col rounded-sm py-1"
					style={{ background: NEUTRAL.highlight }}
				>
					{orphanRows.map((row) => (
						<StatDelta key={row.id} row={row} />
					))}
					{scaleRows.map((row) => (
						<StatDelta key={row.id} row={row} />
					))}
				</div>
			)}
			<OtherChanges
				changes={changes.filter((c) => !isStatChange(c) && !isScaleChange(c))}
			/>

			{/* The first info section usually repeats `desc` verbatim - only fall
			    back to it when there are no sections at all. */}
			{sections.length === 0 && description?.desc && (
				<div
					className="text-gray-300 text-sm"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: first-party API copy
					dangerouslySetInnerHTML={{ __html: description.desc }}
				/>
			)}

			{sections.map((section, index) => {
				// De-duplicated: a property can appear as both a basic property and
				// an important property of a block, which would collide as a key.
				const { loc_string } = section;
				const properties = [...new Set(sectionPropertyKeys(section))];
				if (!loc_string && properties.length === 0) return null;
				return (
					<section
						// biome-ignore lint/suspicious/noArrayIndexKey: sections have no stable id, `loc_string` can repeat or be absent, and the list never reorders
						key={`${loc_string ?? "section"}-${index}`}
						className="flex flex-col"
					>
						{loc_string && (
							<div
								className="my-1 text-gray-300 text-sm"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: first-party API copy
								dangerouslySetInnerHTML={{ __html: loc_string }}
							/>
						)}
						{properties.length > 0 && (
							<PropertyList
								allProperties={allProperties}
								itemProperties={properties}
								background={NEUTRAL.highlight}
								fontColor="#fff"
								className="flex-wrap gap-1"
								previousValues={previousValues}
							/>
						)}
					</section>
				);
			})}

			{sections.length === 0 && !description?.desc && (
				<p className="text-gray-500 text-sm">No detail available.</p>
			)}
		</div>
	);
}
