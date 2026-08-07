import type { Change, Item } from "#/types";
import { isStatChange, statKeyOf } from "#/utils/diffEngine";
import { RenderProperties } from "./card";
import { humaniseStatKey, NEUTRAL } from "./constants";
import StatDelta, { deltaRowsFromChanges } from "./StatDelta";

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
 * Abilities also have no `item_slot_type`, so `Card`'s colour lookup does not
 * apply. The property-resolution logic itself is reused from `card.tsx`.
 */
export default function AbilityDetail({
	item,
	changes,
}: {
	item: Item;
	changes: Change[];
}) {
	const statChanges = changes.filter(isStatChange);
	const changedKeys = new Set(statChanges.map(statKeyOf));
	const sections = item.tooltip_details?.info_sections ?? [];
	const allProperties = item.properties ?? {};

	return (
		<div
			className="mt-2 flex flex-col gap-1 rounded-md p-2"
			style={{ background: NEUTRAL.description }}
		>
			{statChanges.length > 0 && (
				<div
					className="flex flex-col rounded-sm py-1"
					style={{ background: NEUTRAL.highlight }}
				>
					{deltaRowsFromChanges(
						statChanges,
						allProperties,
						(change) =>
							allProperties[statKeyOf(change)]?.label ??
							humaniseStatKey(statKeyOf(change)),
					).map((row) => (
						<StatDelta key={row.id} row={row} />
					))}
				</div>
			)}
			<OtherChanges changes={changes.filter((c) => !isStatChange(c))} />

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
							<RenderProperties
								allProperties={allProperties}
								itemProperties={properties}
								background={NEUTRAL.highlight}
								fontColor="#fff"
								className="flex-wrap gap-1"
								highlightKeys={changedKeys}
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
