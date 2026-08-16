import PropertyList from "#/components/property-list";
import StatDelta, { resolveDeltaRows } from "#/components/stat-delta";
import TextChange from "#/components/text-change";
import type { DisplayChange, Item } from "#/types";
import { colorsFor } from "./constants";
import { renderedKeys } from "./utils";

export default function ItemCard({
	item,
	changes,
	isNew,
	isRemoved,
}: {
	item: Item;
	/** When present, the card gets a change strip and an outline. */
	changes?: DisplayChange[];
	/** Added this patch - there is no previous version to diff against. */
	isNew?: boolean;
	/** Removed this patch - rendered from the snapshot ingest carried forward. */
	isRemoved?: boolean;
}) {
	const {
		name,
		item_slot_type,
		shop_image_webp,
		properties: allProperties,
		cost,
		tooltip_sections,
	} = item;
	const colors = colorsFor(item_slot_type);

	// Every changed property key with a chip gets its delta rendered there
	// instead (PropertyList's `previousValues`) - only changes with nowhere to
	// render inline (cost, cooldown, text, added/removed rows, and orphan
	// stats) stay in the top strip.
	const inlined = renderedKeys(tooltip_sections);
	const isInlinedStat = (change: DisplayChange) =>
		change.kind === "stat" && inlined.has(change.key);
	const previousValues = new Map(
		(changes ?? [])
			.filter((change): change is Extract<DisplayChange, { kind: "stat" }> =>
				isInlinedStat(change),
			)
			.map((change) => [change.key, change.old]),
	);
	const stripChanges = (changes ?? []).filter(
		(change) => !isInlinedStat(change),
	);
	const deltaRows = stripChanges.length
		? resolveDeltaRows(stripChanges, allProperties)
		: [];
	const textChanges = changes?.filter((c) => c.kind === "text") ?? [];
	const flagged = isNew || isRemoved;

	return (
		<div
			className={`m-3 flex max-w-100 min-w-80 flex-col overflow-hidden rounded-md ${isRemoved ? "opacity-60 grayscale" : ""}`}
			style={{
				background: colors.description,
				outline:
					changes?.length || flagged
						? `2px solid ${colors.primary}`
						: undefined,
			}}
		>
			{flagged && (
				<div
					className={`px-2.5 py-1 text-center font-bold text-[11px] uppercase tracking-widest ${isNew ? "bg-emerald-500/25 text-emerald-200" : "bg-rose-500/25 text-rose-200"}`}
				>
					{isNew ? "Added this patch" : "Removed this patch"}
				</div>
			)}
			<div
				className="flex flex-col p-2.5"
				style={{ background: colors.primary }}
			>
				<p className="font-extrabold">{name}</p>
				<p className="font-medium text-green-200">{cost}</p>
			</div>
			<img
				src={shop_image_webp}
				width={80}
				height={80}
				className="mx-auto mt-2"
				alt={name}
			/>

			{changes && changes.length > 0 && (
				<div
					className="mx-2 mt-2 flex flex-col rounded-sm py-1"
					style={{ background: colors.highlight }}
				>
					{deltaRows.map((row) => (
						<StatDelta key={row.id} row={row} />
					))}
					{textChanges.map((change, index) =>
						change.kind === "text" ? (
							<TextChange
								// Positional: an item can carry two sections of the same type.
								// biome-ignore lint/suspicious/noArrayIndexKey: the list is derived from a static payload and never reorders
								key={`text-${index}-${change.section}`}
								before={change.old}
								after={change.new}
							/>
						) : null,
					)}
				</div>
			)}

			{tooltip_sections?.map((stat, sectionIndex) => {
				const { section_type, section_attributes } = stat;
				// In game the cooldown pill sits on the right of the section bar, not
				// in the card header - verified against every screenshotted tooltip.
				const cooldown = section_attributes?.some((attribute) =>
					[
						...(attribute.important_properties ?? []),
						...(attribute.elevated_properties ?? []),
						...(attribute.properties ?? []),
					].includes("AbilityCooldown"),
				)
					? allProperties.AbilityCooldown
					: undefined;
				const hasCooldown = cooldown && +cooldown.value > 0;
				return (
					// biome-ignore lint/suspicious/noArrayIndexKey: `section_type` repeats within a card and the list never reorders
					<div key={`${section_type}-${sectionIndex}`} className="pb-4">
						{section_type !== "innate" && (
							<div
								style={{ background: colors.highlight }}
								className="flex items-center justify-between pl-2 font-bold capitalize"
							>
								{section_type}
								{hasCooldown && (
									<div className="flex items-center gap-1 bg-black px-3 py-0.5 font-normal">
										<img
											src={cooldown.icon}
											height={15}
											width={15}
											alt="cooldown"
										/>
										{cooldown.value}
										{cooldown.postfix}
									</div>
								)}
							</div>
						)}
						{section_attributes?.map((property, attributeIndex) => {
							const {
								loc_string,
								properties,
								important_properties,
								elevated_properties,
								important_properties_with_icon,
							} = property;
							const commonProps = {
								allProperties,
								background: section_type !== "innate" ? colors.highlight : "",
								fontColor: colors.primary,
								className: `${section_type === "innate" && "self-start"}`,
								previousValues,
							};
							return (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: `loc_string` is often absent or repeated, and the list never reorders
									key={`${loc_string ?? "attrs"}-${attributeIndex}`}
									className="w-full"
								>
									{loc_string && (
										<div
											className="my-1 p-2 text-gray-300"
											// biome-ignore lint/security/noDangerouslySetInnerHtml: first-party API copy
											dangerouslySetInnerHTML={{ __html: loc_string }}
										/>
									)}
									<div className="mt-2 flex flex-col gap-0.5">
										{important_properties && (
											<PropertyList
												itemProperties={important_properties}
												importantPropertiesWithIcon={
													important_properties_with_icon
												}
												{...commonProps}
												className={`gap-1 ${section_type === "innate" ? "flex-col" : ""}`}
											/>
										)}
										{elevated_properties && (
											<PropertyList
												itemProperties={elevated_properties}
												{...commonProps}
												className={`${section_type === "innate" && "flex-col"}`}
											/>
										)}
										{properties && (
											<PropertyList
												itemProperties={properties.filter(
													(val) => val !== "AbilityCooldown",
												)}
												{...commonProps}
												className={` ${section_type === "innate" ? "flex-col" : ""}`}
											/>
										)}
									</div>
								</div>
							);
						})}
					</div>
				);
			})}
		</div>
	);
}
