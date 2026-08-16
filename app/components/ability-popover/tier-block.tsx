import TextChange from "#/components/text-change";
import type { TierDiff } from "#/types";
import TierRowView from "./tier-row";

/**
 * One upgrade tier (`T1`/`T2`/`T3`). Stacked vertically in the popover -
 * three side-by-side columns squeezed every label to two or three words per
 * line, and the upgrade text is the whole point of opening this.
 *
 * Unchanged rows are rendered plainly rather than hidden - an ability with no
 * changes should still show what its upgrades actually do.
 */
export default function TierBlock({ tier }: { tier: TierDiff }) {
	const touched =
		Boolean(tier.text) || tier.rows.some((row) => row.kind !== "equal");
	return (
		<div
			className={`rounded-md p-2 text-xs ${touched ? "bg-amber-300/10 ring-1 ring-amber-300/40" : "bg-white/5"}`}
		>
			<div className="mb-1 font-bold text-[10px] text-gray-400 uppercase tracking-widest">
				T{tier.tier}
			</div>
			{tier.rows.length === 0 ? (
				<p className="text-gray-500">No upgrade</p>
			) : (
				tier.rows.map((row) => <TierRowView key={row.key} row={row} />)
			)}
			{tier.text && (
				<div className="mt-1 border-white/10 border-t pt-1">
					<TextChange before={tier.text.old} after={tier.text.new} />
				</div>
			)}
		</div>
	);
}
