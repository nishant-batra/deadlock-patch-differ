import { NEUTRAL } from "#/components/item-card/constants";
import PropertyList from "#/components/property-list";
import StatDelta, { type DeltaRow } from "#/components/stat-delta";
import type { Change, Item } from "#/types";
import { isScaleChange, isStatChange, statKeyOf } from "#/utils/diffEngine";
import { isNegativeProperty } from "#/utils/negativeProperties";
import { humaniseStatKey } from "#/utils/statLabels";
import { renderedKeys } from "./utils";

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
			{shown.map((change) => (
				<span key={change.path.join(".")} className="mr-2 inline-block">
					{humaniseStatKey(change.path.at(-1) ?? "")}
					{change.kind !== "modified" ? ` (${change.kind})` : ""}
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
	const sections = item.tooltip_details?.info_sections ?? [];
	const allProperties = item.properties ?? {};

	// Every changed key with a chip gets its delta rendered there instead
	// (PropertyList's `previousValues`) - only orphans, changed keys the
	// tooltip renders nowhere, still need the strip. Measured on the current
	// patch: 5 of 9 changed ability properties are orphans, so this is the
	// majority path, not a rare fallback.
	const inlined = renderedKeys(sections);
	const previousValues = new Map(
		statChanges
			.filter((change) => inlined.has(statKeyOf(change)))
			.map((change) => [statKeyOf(change), change.old as string | number]),
	);
	const orphanRows: DeltaRow[] = statChanges
		.filter((change) => !inlined.has(statKeyOf(change)))
		.map((change) => {
			const key = statKeyOf(change);
			return {
				id: change.path.join("."),
				label: allProperties[key]?.label ?? humaniseStatKey(key),
				kind: "stat",
				old: change.old as string | number | undefined,
				new: change.new as string | number | undefined,
				// AbilityCooldown and siblings carry no `negative_attribute` in the
				// payload at all - see negativeProperties.ts.
				negativeAttribute:
					allProperties[key]?.negative_attribute ?? isNegativeProperty(key),
				prefix: allProperties[key]?.prefix,
				postfix: allProperties[key]?.postfix,
			};
		});

	// The property's own `value` never moves here - only the multiplier it
	// scales with (e.g. spirit power) did - so this can never be inlined onto
	// the tooltip chip the way a `.value` change is; it always needs its own row.
	const scaleRows: DeltaRow[] = scaleChanges.map((change) => {
		const key = statKeyOf(change);
		const label = allProperties[key]?.label ?? humaniseStatKey(key);
		return {
			id: change.path.join("."),
			label: `${label} Scaling`,
			kind: "stat",
			old: change.old as string | number | undefined,
			new: change.new as string | number | undefined,
			negativeAttribute:
				allProperties[key]?.negative_attribute ?? isNegativeProperty(key),
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
			{sections.length === 0 && item.description?.desc && (
				<div
					className="text-gray-300 text-sm"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: first-party API copy
					dangerouslySetInnerHTML={{ __html: item.description.desc }}
				/>
			)}

			{sections.map((section, index) => {
				// De-duplicated: a property can appear as both a basic property and
				// an important property of a block, which would collide as a key.
				const properties = [
					...new Set([
						...(section.basic_properties ?? []),
						...(section.properties_block?.flatMap((block) =>
							block.properties.map((p) => p.important_property),
						) ?? []),
					]),
				];
				if (!section.loc_string && properties.length === 0) return null;
				return (
					<section
						// biome-ignore lint/suspicious/noArrayIndexKey: sections have no stable id, `loc_string` can repeat or be absent, and the list never reorders
						key={`${section.loc_string ?? "section"}-${index}`}
						className="flex flex-col"
					>
						{section.loc_string && (
							<div
								className="my-1 text-gray-300 text-sm"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: first-party API copy
								dangerouslySetInnerHTML={{ __html: section.loc_string }}
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

			{sections.length === 0 && !item.description?.desc && (
				<p className="text-gray-500 text-sm">No detail available.</p>
			)}
		</div>
	);
}
