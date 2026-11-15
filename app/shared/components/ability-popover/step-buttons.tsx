import clsx from "clsx";
import { ChevronLeft, ChevronRight, RotateCcw, RotateCw } from "lucide-react";
import type { StepTarget } from "./types";

type Direction = "prev" | "next";

/** The small line above the ability name: same hero, another hero, or a wrap. */
const HINTS: Record<
	Direction,
	Record<"same" | "hero" | "wrap" | "wrapHero", string>
> = {
	prev: {
		same: "Previous",
		hero: "Prev hero",
		wrap: "Back to last",
		wrapHero: "Last hero",
	},
	next: {
		same: "Next",
		hero: "Next hero",
		wrap: "Back to first",
		wrapHero: "First hero",
	},
};

/**
 * The popover's footer: full-width Prev / Next buttons that name the ability
 * they open, flag a jump to another hero, and mark a wrap round the list.
 */
export default function StepButtons({
	prev,
	next,
}: {
	prev?: StepTarget;
	next?: StepTarget;
}) {
	return (
		<div className="grid shrink-0 grid-cols-2 gap-2 border-[#2d4b43] border-t bg-[#191917] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
			{prev ? <StepButton target={prev} direction="prev" /> : <span />}
			{next ? <StepButton target={next} direction="next" /> : <span />}
		</div>
	);
}

function StepButton({
	target: { name, heroName, wraps, go },
	direction,
}: {
	target: StepTarget;
	direction: Direction;
}) {
	const isNext = direction === "next";
	const hint =
		HINTS[direction][
			wraps ? (heroName ? "wrapHero" : "wrap") : heroName ? "hero" : "same"
		];
	const Chevron = isNext ? ChevronRight : ChevronLeft;
	const Wrap = isNext ? RotateCw : RotateCcw;

	return (
		<button
			type="button"
			onClick={go}
			className={clsx(
				"flex min-h-14 min-w-0 items-center gap-2.5 border-[1.5px] px-3 py-2",
				isNext
					? "flex-row-reverse border-amber-400 bg-amber-400 text-right text-[#1d1d1b] hover:bg-amber-300"
					: clsx(
							"bg-[#262624] text-left text-[#f5f0e6] hover:bg-[#2f2f2c]",
							heroName ? "border-amber-400" : "border-[#4a4a45]",
						),
			)}
		>
			<Chevron size={22} strokeWidth={2.25} aria-hidden className="shrink-0" />
			<span className={clsx("flex min-w-0 flex-col", isNext && "items-end")}>
				<span
					className={clsx(
						"flex max-w-full items-center gap-1 text-xs",
						isNext ? "text-[#3d2e05]" : "text-[#b8b3a7]",
					)}
				>
					{wraps && <Wrap size={12} aria-hidden className="shrink-0" />}
					<span className="truncate">
						{hint}
						{heroName && ` · ${heroName}`}
					</span>
				</span>
				<span className="max-w-full truncate font-bold">{name}</span>
			</span>
		</button>
	);
}
