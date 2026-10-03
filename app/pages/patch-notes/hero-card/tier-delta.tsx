import { formatTierBonus } from "#/shared/components/ability-tier/utils";
import ScalingIcon from "#/shared/components/scaling-icon";
import type { TierDiff } from "#/types";

/** One upgrade bonus that moved, as a ledger line: label, then the move. */
export default function TierDelta({ row }: { row: TierDiff["rows"][number] }) {
	const { label, kind, old, new: next, scaling } = row;
	return (
		<div className="flex items-baseline justify-between gap-2 py-0.5">
			<span className="flex items-center text-gray-300">
				{label}
				{scaling && <ScalingIcon filter={scaling} />}
			</span>
			{kind === "added" ? (
				<span className="flex items-baseline gap-1">
					<span className="rounded bg-emerald-500/20 px-1 font-bold text-[9px] text-emerald-300 uppercase">
						New
					</span>
					<b className="text-emerald-300">{formatTierBonus(next, row)}</b>
				</span>
			) : kind === "removed" ? (
				<span className="flex items-baseline gap-1">
					<span className="rounded bg-rose-500/20 px-1 font-bold text-[9px] text-rose-300 uppercase">
						Gone
					</span>
					<s className="text-gray-500">{formatTierBonus(old, row)}</s>
				</span>
			) : (
				<span className="flex items-baseline gap-1 font-bold">
					<s className="font-normal text-gray-500">
						{formatTierBonus(old, row)}
					</s>
					<span className="text-gray-500">&rarr;</span>
					<span className="text-amber-300">{formatTierBonus(next, row)}</span>
				</span>
			)}
		</div>
	);
}
