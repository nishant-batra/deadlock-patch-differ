import clsx from "clsx";
import ScalingIcon from "#/shared/components/scaling-icon";
import type { TierDiff } from "#/types";
import { formatTierBonus } from "./utils";

/**
 * One bonus of a tier: the value over its label, like the game's own tier
 * text. `compact` is the small "numbers that moved" line under a tier's copy.
 */
export default function TierRow({
	row,
	compact = false,
}: {
	row: TierDiff["rows"][number];
	compact?: boolean;
}) {
	const { label, kind, old, new: next, scaling } = row;
	const removed = kind === "removed";
	const value = (
		<span className="inline-flex items-baseline gap-1.5">
			{kind === "changed" && (
				<s className="font-medium text-[0.75em] text-gray-400 decoration-[#e0716a] decoration-[1.5px]">
					{formatTierBonus(old, row)}
				</s>
			)}
			<span
				className={clsx(
					"font-bold",
					removed
						? "text-[#f08a84] line-through"
						: kind === "added"
							? "text-[#3ed39a]"
							: "text-[#f4efe4]",
				)}
			>
				{formatTierBonus(removed ? old : next, row)}
			</span>
			{scaling && <ScalingIcon filter={scaling} />}
		</span>
	);

	return compact ? (
		<p className="text-[#a8a397] text-xs">
			{value} {label}
		</p>
	) : (
		<div className="flex flex-col items-center">
			<span className="text-[17px]">{value}</span>
			<span
				className={clsx(
					"leading-snug",
					removed ? "text-gray-500" : "text-[#cfcac0]",
				)}
			>
				{label}
			</span>
		</div>
	);
}
