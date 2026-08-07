import type { DisplayChange, ImportantPropertiesWithIcon, Item } from "#/types";
import { colorsFor, RESPONSE_CONVERSION_MAP } from "./constants";
import StatDelta, { resolveDeltaRows } from "./StatDelta";
import TextChange from "./TextChange";

/** The property keys this patch moved, for the marker ring on the row itself. */
const changedKeysOf = (changes: DisplayChange[]) =>
	new Set(
		changes.flatMap((change) =>
			change.kind === "stat" ||
			change.kind === "row-added" ||
			change.kind === "row-removed"
				? [change.key]
				: [],
		),
	);

export default function Card({
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
	const deltaRows = changes ? resolveDeltaRows(changes, allProperties) : [];
	const textChanges = changes?.filter((c) => c.kind === "text") ?? [];
	const changedKeys = changedKeysOf(changes ?? []);
	const flagged = isNew || isRemoved;

	return (
		<div
			className={`m-3 flex w-100 flex-col overflow-hidden rounded-md ${isRemoved ? "opacity-60 grayscale" : ""}`}
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
								highlightKeys: changedKeys,
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
											<RenderProperties
												itemProperties={important_properties}
												importantPropertiesWithIcon={
													important_properties_with_icon
												}
												{...commonProps}
												className={`gap-1 ${section_type === "innate" ? "flex-col" : ""}`}
											/>
										)}
										{elevated_properties && (
											<RenderProperties
												itemProperties={elevated_properties}
												{...commonProps}
												className={`${section_type === "innate" && "flex-col"}`}
											/>
										)}
										{properties && (
											<RenderProperties
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

export function RenderProperties({
	allProperties,
	itemProperties,
	background,
	fontColor,
	className,
	importantPropertiesWithIcon,
}: {
	allProperties: Item["properties"];
	itemProperties: Array<string>;
	background?: string;
	fontColor: string;
	className?: string;
	importantPropertiesWithIcon?: ImportantPropertiesWithIcon[];
	/** Property keys that moved in this patch - rendered with a marker ring. */
	highlightKeys?: Set<string>;
}) {
	return (
		<div className={`flex flex-1 ${className ?? ""}`}>
			{itemProperties.map((property) => {
				const displayProperty = allProperties[property];
				if (!displayProperty) return null;
				const {
					label,
					value,
					postfix,
					prefix,
					icon,
					tooltip_is_important,
					tooltip_is_elevated,
					usage_flags,
					negative_attribute,
					tooltip_section,
				} = displayProperty;
				const importantPropertyWithIcon = importantPropertiesWithIcon?.find(
					(val) => val.name === property,
				);
				const {
					icon: importantPropertyIcon,
					localized_name: importantPropertyName,
				} = importantPropertyWithIcon ?? {};
				const isConditional = usage_flags?.includes("ConditionallyApplied");
				const isStatusEffect =
					importantPropertyWithIcon?.name.includes("StatusEffect");
				const showPostfix =
					postfix &&
					value &&
					typeof value === "string" &&
					value?.slice(value?.length - postfix?.length) !== postfix;
				return (
					<div
						key={property}
						className={`flex flex-1 flex-wrap items-center gap-0.5 px-2 ${tooltip_is_important ? "flex-col p-2" : ""}  ${tooltip_section !== "innate" ? "justify-center p-2" : ""}`}
						style={{ background }}
					>
						<div
							className={`flex ${tooltip_is_important ? "text-xl" : ""} ${negative_attribute ? "text-[#CE7A6F]" : ""}`}
						>
							{Boolean(
								(tooltip_is_important && icon) || importantPropertyIcon,
							) && (
								<img
									alt={label}
									src={icon ?? importantPropertyIcon}
									width={20}
									height={20}
								/>
							)}
							{prefix ? (
								<span className="text-gray-300">
									{Object.hasOwn(RESPONSE_CONVERSION_MAP, prefix)
										? RESPONSE_CONVERSION_MAP[prefix]
										: prefix}
								</span>
							) : null}
							<b>{value ?? importantPropertyName}</b>

							{showPostfix && (
								<span
									className={`${negative_attribute ? "text-[#CE7A6F]" : "text-gray-400"}`}
								>
									{postfix}
								</span>
							)}
						</div>
						<span
							style={{
								color: tooltip_is_important
									? fontColor
									: tooltip_is_elevated
										? "#fff"
										: "#d1d5dc",
							}}
							className={`text-center ${tooltip_is_elevated && "font-bold"}`}
						>
							{label}
						</span>
						{Boolean(
							(isConditional && tooltip_is_important) ||
								(isStatusEffect && importantPropertyWithIcon),
						) && (
							<p className="font-medium text-gray-300 italic">
								{isConditional && tooltip_is_important
									? "Conditional"
									: "Status Effect"}
							</p>
						)}
					</div>
				);
			})}
		</div>
	);
}
