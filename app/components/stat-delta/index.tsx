import { resolvePrefix, shouldAppendPostfix } from "#/utils/statFormatting";
import { type DeltaRow, formatDeltaValue, toneOfDeltaRow } from "./utils";

export type { DeltaRow } from "./utils";
export {
	deltaRowsFromChanges,
	formatDeltaValue,
	resolveDeltaRows,
	toneOfDeltaRow,
} from "./utils";

/** `prefix` + the formatted number/string + `postfix`, same rendering as a `PropertyList` chip. */
const withUnits = (value: unknown, row: DeltaRow) =>
	`${resolvePrefix(row.prefix)}${formatDeltaValue(value)}${shouldAppendPostfix(value, row.postfix) ? row.postfix : ""}`;

export default function StatDelta({ row }: { row: DeltaRow }) {
	const tone = toneOfDeltaRow(row);
	return (
		<div className="flex flex-wrap items-baseline justify-between gap-2 px-2 py-1 text-sm">
			<span className="text-gray-300">{row.label}</span>
			{row.kind === "added" ? (
				<span className="flex items-baseline gap-1.5">
					<span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-bold text-[10px] text-emerald-300 uppercase tracking-wide">
						New
					</span>
					<b className={tone}>{withUnits(row.new, row)}</b>
				</span>
			) : row.kind === "removed" ? (
				<span className="flex items-baseline gap-1.5">
					<span className="rounded bg-rose-500/20 px-1.5 py-0.5 font-bold text-[10px] text-rose-300 uppercase tracking-wide">
						Removed
					</span>
					<s className="text-gray-400">{withUnits(row.old, row)}</s>
				</span>
			) : (
				<span className="flex items-baseline gap-1.5 font-bold">
					<s className="font-normal text-gray-500">{withUnits(row.old, row)}</s>
					<span className="text-gray-500">&rarr;</span>
					<span className={tone}>{withUnits(row.new, row)}</span>
				</span>
			)}
		</div>
	);
}
