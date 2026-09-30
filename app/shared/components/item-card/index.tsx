import clsx from "clsx";
import { statusEffectDurations } from "#/lib/statusEffects";
import CutFrame from "#/shared/components/cut-frame";
import PropertyList from "#/shared/components/property-list";
import StatDelta, { resolveDeltaRows } from "#/shared/components/stat-delta";
import TextChange from "#/shared/components/text-change";
import type { DisplayChange, Item } from "#/types";
import { colorsFor } from "./constants";
import { renderedKeys } from "./utils";

export default function ItemCard({
	item,
	changes,
	isNew,
	isRemoved,
	isChanged,
}: {
	item: Item;
	/** When present, the card gets a change strip and a ring. */
	changes?: DisplayChange[];
	/** Added this patch - there is no previous version to diff against. */
	isNew?: boolean;
	/** Removed this patch - rendered from the snapshot ingest carried forward. */
	isRemoved?: boolean;
	/** Explicit, not derived from `changes`: on the Changes page every card in
	 * the "changed" section is already known to be changed, so a flag bar
	 * there would be redundant - only `/items` (which mixes changed and
	 * unchanged items) opts in. */
	isChanged?: boolean;
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
	const statusDurations = statusEffectDurations(item);
	const inlined = renderedKeys(tooltip_sections, statusDurations);
	const isInlinedStat = (change: DisplayChange) =>
		change.kind === "stat" && inlined.has(change.key);
	const previousValues = new Map(
		(changes ?? [])
			.filter((change): change is Extract<DisplayChange, { kind: "stat" }> =>
				isInlinedStat(change),
			)
			.map(({ key, old }) => [key, old]),
	);
	const stripChanges = (changes ?? []).filter(
		(change) => !isInlinedStat(change),
	);
	const deltaRows = stripChanges.length
		? resolveDeltaRows(stripChanges, allProperties)
		: [];
	const textChanges = changes?.filter((c) => c.kind === "text") ?? [];
	const flagged = isNew || isRemoved || isChanged;
	const framed = Boolean(changes?.length || flagged);

	return (
		<CutFrame
			color={colors.primary}
			width={framed ? 2 : 0}
			className={clsx(
				"m-3 flex max-w-100 min-w-0",
				isRemoved && "opacity-60 grayscale",
			)}
		>
			<div
				className="cut-double flex flex-1 flex-col overflow-hidden"
				style={{ background: colors.description, contentVisibility: "auto" }}
			>
				{flagged && (
					<div
						className={clsx(
							"cut-corner px-2.5 py-1 text-center font-bold text-[11px] uppercase tracking-widest",
							isNew
								? "bg-emerald-500/25 text-emerald-200"
								: isRemoved
									? "bg-rose-500/25 text-rose-200"
									: "bg-amber-500/25 text-amber-200",
						)}
					>
						{isNew
							? "Added this patch"
							: isRemoved
								? "Removed this patch"
								: "Changed this patch"}
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
					className="cut-double mx-auto mt-2 [--cut:var(--cut-md)]"
					alt={name}
				/>

				{(deltaRows.length > 0 || textChanges.length > 0) && (
					<div
						className="mx-2 mt-2 flex flex-col border-l-2 py-1"
						style={{
							background: colors.highlight,
							borderLeftColor: colors.primary,
						}}
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

				{tooltip_sections?.map(
					({ section_type, section_attributes }, sectionIndex) => {
						// In game the cooldown pill sits on the right of the section bar, not
						// in the card header - verified against every screenshotted tooltip.
						const cooldown = section_attributes?.some(
							({ important_properties, elevated_properties, properties }) =>
								[
									...(important_properties ?? []),
									...(elevated_properties ?? []),
									...(properties ?? []),
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
								{section_attributes?.map(
									(
										{
											loc_string,
											properties,
											important_properties,
											elevated_properties,
											important_properties_with_icon,
										},
										attributeIndex,
									) => {
										const commonProps = {
											allProperties,
											background:
												section_type !== "innate" ? colors.highlight : "",
											fontColor: colors.primary,
											changedFrameColor: colors.primary,
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
															statusDurations={statusDurations}
															{...commonProps}
															// Wrap with a 40% floor per chip so a row holds at most
															// two - a third chip (e.g. `old -> new` values) would
															// otherwise squeeze and clip its text.
															className={clsx(
																"flex-wrap gap-1 *:min-w-[40%]",
																section_type === "innate" && "flex-col",
															)}
														/>
													)}
													{elevated_properties && (
														<PropertyList
															itemProperties={elevated_properties}
															{...commonProps}
															className={clsx(
																section_type === "innate" && "flex-col",
															)}
														/>
													)}
													{properties && (
														<PropertyList
															itemProperties={properties.filter(
																(val) => val !== "AbilityCooldown",
															)}
															{...commonProps}
															className={clsx(
																section_type === "innate" && "flex-col",
															)}
														/>
													)}
												</div>
											</div>
										);
									},
								)}
							</div>
						);
					},
				)}
			</div>
		</CutFrame>
	);
}
