import { Fragment } from "react";
import type { WordingEntry } from "./utils";

/**
 * Wording-only rewrites collapsed to one line of ability names. Most are typo
 * and grammar fixes, so they stay out of the way of the number changes above;
 * each name opens that ability's popover, which shows the word diff.
 */
export default function WordingLine({
	wording,
	openAbility,
	onOpen,
}: {
	wording: WordingEntry[];
	openAbility: number | null;
	onOpen: (index: number) => void;
}) {
	if (wording.length === 0) return null;
	return (
		<p className="mx-2.5 mt-2 flex flex-wrap items-baseline gap-x-2 bg-[#22222c] px-2.5 py-2 text-gray-400 text-sm">
			<span className="font-bold text-[10px] uppercase tracking-widest">
				Wording
			</span>
			<span>
				{wording.map(({ ability: { id, name }, index }, position) => (
					<Fragment key={id}>
						{position > 0 && ", "}
						<button
							type="button"
							aria-expanded={openAbility === index}
							onClick={() => onOpen(index)}
							className="text-gray-300 underline decoration-white/20 underline-offset-2 hover:text-white"
						>
							{name}
						</button>
					</Fragment>
				))}
			</span>
		</p>
	);
}
