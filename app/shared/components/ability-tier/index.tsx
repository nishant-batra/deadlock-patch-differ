import clsx from "clsx";
import GameText from "#/shared/components/game-text";
import type { TierDiff } from "#/types";
import TierRow from "./tier-row";
import { isTierTouched, TIER_COST } from "./utils";

/**
 * One upgrade tier, as the in-game card draws it: the ability-point cost under
 * a green diamond, then what the tier does. The game describes a tier with its
 * own `t{n}_desc` copy where it has one, and the per-bonus rows are the
 * fallback - one or the other, never both, same as an unpatched tier. A changed
 * tier marks the change on whichever it shows: the copy's word diff already
 * strikes the old numbers. Only when bonuses moved under unchanged copy (it
 * does not mention them) are the moved rows added, since nothing else would
 * show them.
 */
export default function AbilityTier({
	tier,
	desc,
}: {
	tier: TierDiff;
	/** The tier's current `t{n}_desc` copy, when the ability has one. */
	desc?: string;
}) {
	const { tier: number, rows, text } = tier;
	const touched = isTierTouched(tier);
	const allNew = rows.length > 0 && rows.every(({ kind }) => kind === "added");
	const moved = text ? [] : rows.filter(({ kind }) => kind !== "equal");
	const copy = text?.new ?? desc;

	return (
		<div
			className={clsx(
				"relative flex min-h-28 flex-col border-[1.5px] text-sm",
				touched
					? "border-[#b08a3a] bg-[#23211a]"
					: "border-[#2f4a42] bg-[#1b201e]",
			)}
		>
			{touched && (
				<span
					className={clsx(
						"-top-2.5 absolute left-2.5 px-1.5 py-0.5 font-bold text-[10px] uppercase leading-tight tracking-wider",
						allNew
							? "bg-[#3ed39a] text-[#05170f]"
							: "bg-[#f2c14e] text-[#1b1608]",
					)}
				>
					{allNew ? "New" : "Changed"}
				</span>
			)}
			<div
				title={`Tier ${number}`}
				className={clsx(
					"flex items-center justify-center gap-1.5 border-b p-1.5 font-bold text-[#e6e1d6]",
					touched ? "border-[#b08a3a]" : "border-[#2f4a42]",
				)}
			>
				<svg
					viewBox="0 0 16 16"
					fill="none"
					stroke="#45d19c"
					strokeWidth="1.6"
					aria-hidden="true"
					className="size-4!"
				>
					<path d="M8 1.5 14.5 8 8 14.5 1.5 8z" />
					<circle cx="8" cy="8" r="2" />
				</svg>
				{TIER_COST[number]}
			</div>
			<div className="flex flex-1 flex-col items-center justify-center gap-1 p-2.5 text-center">
				{copy ? (
					<>
						<GameText
							html={copy}
							previous={text?.old}
							className="text-[#cfcac0] leading-snug"
						/>
						{moved.map((row) => (
							<TierRow key={row.key} row={row} compact />
						))}
					</>
				) : rows.length === 0 ? (
					<p className="text-gray-500">No upgrade</p>
				) : (
					rows.map((row) => <TierRow key={row.key} row={row} />)
				)}
			</div>
		</div>
	);
}
