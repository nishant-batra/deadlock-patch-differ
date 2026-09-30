import {
	formatDeltaValue,
	toneOfDeltaRow,
} from "#/shared/components/stat-delta";
import { shouldAppendPostfix } from "#/shared/utils/statFormatting";
import type { ImportantPropertiesWithIcon, ItemProperty } from "#/types";

/**
 * A status-effect badge ("Stunned 0.5s"). The `StatusEffectX` key has no
 * `properties` entry, so it cannot go through the regular chip: its icon and
 * name come from `important_properties_with_icon`, and its duration - when it
 * has one - from the property `statusEffectDurationKey()` resolved.
 */
export default function StatusChip({
	effect,
	duration,
	previousValue,
	background,
	fontColor,
}: {
	effect: ImportantPropertiesWithIcon;
	duration?: ItemProperty;
	/** The duration's pre-patch value, when it moved this patch. */
	previousValue?: string | number;
	background?: string;
	fontColor: string;
}) {
	const { icon, name, localized_name } = effect;
	const { value, postfix: durationPostfix } = duration ?? {};
	const postfix =
		value !== undefined && shouldAppendPostfix(value, durationPostfix)
			? durationPostfix
			: "";

	return (
		<div
			className="flex flex-1 flex-col flex-wrap items-center justify-center gap-0.5 p-2"
			style={{ background }}
		>
			<div className="flex items-center gap-1 text-xl">
				<img alt="" src={icon} width={20} height={20} />
				{value !== undefined &&
					(previousValue !== undefined ? (
						<span className="flex items-baseline gap-1 text-lg">
							<s className="font-normal text-gray-500">
								{formatDeltaValue(previousValue)}
							</s>
							<span className="text-gray-500">&rarr;</span>
							<b
								className={toneOfDeltaRow({
									id: name,
									label: localized_name,
									kind: "stat",
									old: previousValue,
									new: value,
									// A longer stun/silence is a buff for the item's owner.
									negativeAttribute: false,
								})}
							>
								{value}
								{postfix}
							</b>
						</span>
					) : (
						<b>
							{value}
							<span className="text-gray-400">{postfix}</span>
						</b>
					))}
			</div>
			<span className="text-center" style={{ color: fontColor }}>
				{localized_name}
			</span>
			<p className="font-medium text-gray-300 italic">Status Effect</p>
		</div>
	);
}
