import {
	resolvePrefix,
	shouldAppendPostfix,
} from "#/shared/utils/statFormatting";
import { type DeltaRow, formatDeltaValue, toneOfDeltaRow } from "./utils";

export type { DeltaRow } from "./utils";
export { formatDeltaValue, resolveDeltaRows, toneOfDeltaRow } from "./utils";

/** `prefix` + the formatted number/string + `postfix`, same rendering as a `PropertyList` chip. */
const withUnits = (value: unknown, { prefix, postfix }: DeltaRow) =>
	`${resolvePrefix(prefix)}${formatDeltaValue(value)}${shouldAppendPostfix(value, postfix) ? postfix : ""}`;

export default function StatDelta({ row }: { row: DeltaRow }) {
	const { label, kind, old, new: next } = row;
	const tone = toneOfDeltaRow(row);
	return (
		// `min-w-0` + `overflow-wrap:anywhere` let an unbreakable value (a long
		// range, a URL) wrap inside the row instead of widening the card.
		<div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2 px-2 py-1 text-sm [overflow-wrap:anywhere]">
			<span className="min-w-0 text-gray-300">{label}</span>
			{kind === "added" ? (
				<span className="flex min-w-0 items-baseline gap-1.5">
					<span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-bold text-[10px] text-emerald-300 uppercase tracking-wide">
						New
					</span>
					<b className={tone}>{withUnits(next, row)}</b>
				</span>
			) : kind === "removed" ? (
				<span className="flex min-w-0 items-baseline gap-1.5">
					<span className="rounded bg-rose-500/20 px-1.5 py-0.5 font-bold text-[10px] text-rose-300 uppercase tracking-wide">
						Removed
					</span>
					<s className="text-gray-400">{withUnits(old, row)}</s>
				</span>
			) : (
				<span className="flex min-w-0 flex-wrap items-baseline gap-1.5 font-bold">
					<s className="font-normal text-gray-500">{withUnits(old, row)}</s>
					<span className="text-gray-500">&rarr;</span>
					<span className={tone}>{withUnits(next, row)}</span>
				</span>
			)}
		</div>
	);
}
