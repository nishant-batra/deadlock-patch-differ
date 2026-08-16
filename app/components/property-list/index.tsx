import { formatDeltaValue, toneOfDeltaRow } from "#/components/stat-delta";
import type { ImportantPropertiesWithIcon, Item } from "#/types";
import { isNegativeProperty } from "#/utils/negativeProperties";
import { resolvePrefix } from "#/utils/statFormatting";

export default function PropertyList({
	allProperties,
	itemProperties,
	background,
	fontColor,
	className,
	importantPropertiesWithIcon,
	previousValues,
}: {
	allProperties: Item["properties"];
	itemProperties: Array<string>;
	background?: string;
	fontColor: string;
	className?: string;
	importantPropertiesWithIcon?: ImportantPropertiesWithIcon[];
	/** Property keys that moved this patch, mapped to their pre-patch value -
	 * rendered inline as `old -> new` on the chip itself rather than restated
	 * in a separate strip. */
	previousValues?: Map<string, string | number>;
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
				const previousValue = previousValues?.get(property);
				const changed = previousValue !== undefined;
				return (
					<div
						key={property}
						className={`flex flex-1 flex-wrap items-center gap-0.5 px-2 ${tooltip_is_important ? "flex-col p-2" : ""}  ${tooltip_section !== "innate" ? "justify-center p-2" : ""} ${changed ? "rounded ring-1 ring-amber-300/60" : ""}`}
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
								<span className="text-gray-300">{resolvePrefix(prefix)}</span>
							) : null}
							{changed ? (
								<span className="flex items-baseline gap-1">
									{/* previousValue already carries its own unit (e.g. "70m") -
									    postfix is never appended to it. */}
									<s className="font-normal text-gray-500">
										{formatDeltaValue(previousValue)}
									</s>
									<span className="text-gray-500">&rarr;</span>
									<b
										className={toneOfDeltaRow({
											id: property,
											label: label ?? property,
											kind: "stat",
											old: previousValue,
											new: value,
											negativeAttribute:
												negative_attribute ?? isNegativeProperty(property),
										})}
									>
										{value}
									</b>
								</span>
							) : (
								<b>{value ?? importantPropertyName}</b>
							)}

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
