import clsx from "clsx";
import { isStatusEffectKey } from "#/lib/statusEffects";
import {
	formatDeltaValue,
	toneOfDeltaRow,
} from "#/shared/components/stat-delta";
import { isNegativeProperty } from "#/shared/utils/negativeProperties";
import {
	resolvePrefix,
	shouldAppendPostfix,
} from "#/shared/utils/statFormatting";
import type { ImportantPropertiesWithIcon, Item } from "#/types";
import StatusChip from "./status-chip";

export default function PropertyList({
	allProperties,
	itemProperties,
	background,
	fontColor,
	className,
	importantPropertiesWithIcon,
	previousValues,
	statusDurations,
	changedFrameColor = "rgb(252 211 77 / 0.6)",
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
	/** Status-effect key -> the duration property its badge shows
	 * (`statusEffectDurations()`). */
	statusDurations?: Map<string, string>;
	/** Frame colour for changed chips - item cards pass their slot colour so
	 * the chip frame matches the card frame. */
	changedFrameColor?: string;
}) {
	return (
		<div className={clsx("flex flex-1", className)}>
			{itemProperties.map((property) => {
				const displayProperty = allProperties[property];
				if (!displayProperty) {
					// Status effects have no `properties` entry - they render as a badge.
					const effect = importantPropertiesWithIcon?.find(
						({ name }) => name === property,
					);
					if (!effect || !isStatusEffectKey(property)) return null;
					const durationKey = statusDurations?.get(property);
					return (
						<StatusChip
							key={property}
							effect={effect}
							duration={durationKey ? allProperties[durationKey] : undefined}
							previousValue={
								durationKey ? previousValues?.get(durationKey) : undefined
							}
							background={background}
							fontColor={fontColor}
						/>
					);
				}
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
					({ name }) => name === property,
				);
				const {
					icon: importantPropertyIcon,
					localized_name: importantPropertyName,
				} = importantPropertyWithIcon ?? {};
				const isConditional = usage_flags?.includes("ConditionallyApplied");
				const isStatusEffect =
					importantPropertyWithIcon?.name.includes("StatusEffect");
				const showPostfix =
					value &&
					typeof value === "string" &&
					shouldAppendPostfix(value, postfix);
				const previousValue = previousValues?.get(property);
				const changed = previousValue !== undefined;

				// A property still gated behind an unpurchased ability upgrade tier
				// renders here at its base value of 0 - real information, but only
				// the tier that unlocks it (shown separately) says so; a bare "0"
				// chip with no context is noise. Diffed properties are exempt: a
				// change *to* or *from* 0 is still a real delta worth showing. So are
				// `tooltip_is_elevated` properties - Valve marked them worth featuring
				// regardless of value, so hiding them at 0 would hide that call.
				if (!changed && !tooltip_is_elevated && (value === 0 || value === "0"))
					return null;

				const chip = (
					<div
						key={property}
						className={clsx(
							"flex flex-1 flex-wrap items-center gap-0.5 px-2",
							tooltip_is_important && "flex-col p-2",
							tooltip_section !== "innate" && "justify-center p-2",
						)}
						style={{ background }}
					>
						<div
							// Changed chips drop a size: `old -> new` is roughly twice as wide
							// as a lone value and would otherwise overflow the stat row.
							className={clsx(
								"flex",
								tooltip_is_important && (changed ? "text-lg" : "text-xl"),
								negative_attribute && "text-[#CE7A6F]",
							)}
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
									className={
										negative_attribute ? "text-[#CE7A6F]" : "text-gray-400"
									}
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
							className={clsx(
								"text-center",
								tooltip_is_elevated && "font-bold",
							)}
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

				// Changed chips are framed the same way the card is: an outer layer
				// in the frame colour with padding, the chip sitting inside it - a
				// ring/outline gets lost against the dark chip background.
				return changed ? (
					<div
						key={property}
						className="flex flex-1 p-[1.5px]"
						style={{ background: changedFrameColor }}
					>
						{chip}
					</div>
				) : (
					chip
				);
			})}
		</div>
	);
}
