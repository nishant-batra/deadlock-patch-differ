import clsx from "clsx";
import PreviousValue from "#/shared/components/previous-value";
import PropertyValue from "#/shared/components/property-value";
import { humaniseStatKey } from "#/shared/utils/statLabels";
import type { ItemProperty } from "#/types";
import { faceDirection, scalingOf } from "./utils";

/** Box colours by what the stat scales with - the game tints weapon and spirit. */
const BOX = {
	weapon: "border-[#7c5a2e] bg-[#3b2b1a]",
	spirit: "border-[#8a68bd] bg-[#3a2a50]",
	neutral: "border-[#3a3935] bg-[#3a3935]",
} as const;

const TAG = {
	better: { text: "Buff", className: "bg-[#3ed39a] text-[#05170f]" },
	worse: { text: "Nerf", className: "bg-[#f08a84] text-[#1f0705]" },
	neutral: { text: "Changed", className: "bg-[#f2c14e] text-[#1b1608]" },
} as const;

/**
 * One of a section's big stat boxes. A moved value or multiplier shows its
 * old number struck in place, and the box is outlined and tagged with the
 * move's direction - the only place the card says buff or nerf.
 */
export default function StatBox({
	propertyKey,
	property,
	previous,
	previousScale,
}: {
	propertyKey: string;
	property: ItemProperty;
	previous?: string | number;
	previousScale?: string | number;
}) {
	const { label, icon } = property;
	const scaling = scalingOf(property);
	const kind = scaling?.icon?.kind;
	const tint = kind === "weapon" || kind === "spirit" ? kind : "neutral";
	const changed = previous !== undefined || previousScale !== undefined;
	const tag =
		TAG[
			previous !== undefined
				? faceDirection(propertyKey, property, previous)
				: "neutral"
		];

	return (
		<div
			className={clsx(
				"relative flex flex-col items-center justify-center gap-1 border-[1.5px] px-2 pt-5 pb-3 text-center",
				BOX[tint],
				changed && "outline-2 outline-[#f2c14e] outline-offset-2",
			)}
		>
			{changed && (
				<span
					className={clsx(
						"-top-2.5 absolute left-2.5 px-1.5 py-0.5 font-bold text-[10px] uppercase leading-tight tracking-wider",
						tag.className,
					)}
				>
					{tag.text}
				</span>
			)}
			{scaling && (
				<span
					title={scaling.icon?.label}
					className="absolute top-1.5 right-2 flex items-center gap-1 font-semibold text-[#d2cbbb] text-[10px]"
				>
					{/* `lazy` keeps these icons from delaying the popover's
					    <ViewTransition> - see card-header.tsx. */}
					{scaling.icon && (
						<img
							src={scaling.icon.src}
							alt=""
							width={14}
							height={14}
							loading="lazy"
						/>
					)}
					{previousScale !== undefined && (
						<PreviousValue value={previousScale} />
					)}
					x {scaling.scale}
				</span>
			)}
			<span className="flex items-center gap-1.5 font-bold text-[#f4efe4] text-[1.75rem] leading-none">
				{icon && (
					<img src={icon} alt="" width={22} height={22} loading="lazy" />
				)}
				<PropertyValue
					property={property}
					previous={previous}
					unitClassName="text-sm"
				/>
			</span>
			<span className="font-semibold text-[#e2ddd1] text-[13px]">
				{label ?? humaniseStatKey(propertyKey)}
			</span>
		</div>
	);
}
