import ScalingIcon from "#/components/scaling-icon";
import type { TierDiff } from "#/types";
import { formatBonus } from "./utils";

export default function TierRowView({
	row,
}: {
	row: TierDiff["rows"][number];
}) {
	const scaled = row.scaling ? <ScalingIcon filter={row.scaling} /> : null;

	if (row.kind === "added") {
		return (
			<div className="flex items-baseline justify-between gap-2 py-0.5 ">
				<span className="text-gray-300 flex items-center">
					{row.label}
					{scaled}
				</span>
				<span className="flex items-baseline gap-1">
					<span className="rounded bg-emerald-500/20 px-1 font-bold text-[9px] text-emerald-300 uppercase">
						New
					</span>
					<b className="text-emerald-300">{formatBonus(row.new)}</b>
				</span>
			</div>
		);
	}
	if (row.kind === "removed") {
		return (
			<div className="flex items-baseline justify-between gap-2 py-0.5">
				<span className="text-gray-500 flex items-center">
					{row.label}
					{scaled}
				</span>
				<span className="flex items-baseline gap-1">
					<span className="rounded bg-rose-500/20 px-1 font-bold text-[9px] text-rose-300 uppercase">
						Gone
					</span>
					<s className="text-gray-500">{formatBonus(row.old)}</s>
				</span>
			</div>
		);
	}
	if (row.kind === "changed") {
		return (
			<div className="flex items-baseline justify-between gap-2 py-0.5">
				<span className="text-gray-300 flex items-center">
					{row.label}
					{scaled}
				</span>
				<span className="flex items-baseline gap-1 font-bold">
					<s className="font-normal text-gray-500">{formatBonus(row.old)}</s>
					<span className="text-gray-500">&rarr;</span>
					<span className="text-amber-300">{formatBonus(row.new)}</span>
				</span>
			</div>
		);
	}
	return (
		<div className="flex items-baseline justify-between gap-2 py-0.5">
			<span className="text-gray-400 flex items-center">
				{row.label}
				{scaled}
			</span>
			<span className="text-gray-200">{formatBonus(row.new)}</span>
		</div>
	);
}
