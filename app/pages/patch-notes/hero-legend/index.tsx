import { CHANGED_COLOR } from "#/shared/components/ability-row/constants";
import CutFrame from "#/shared/components/cut-frame";

/** A white disc standing in for an ability icon, styled like the real ones. */
const PLACEHOLDER_ICON =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Ccircle cx='5' cy='5' r='2.5' fill='white'/%3E%3C/svg%3E";

/**
 * How to read the ability half of a hero card, in one line: the card only
 * shows which abilities changed, the popover shows how.
 */
export default function HeroLegend() {
	return (
		<p className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-400 text-sm">
			<CutFrame cut="sm" color={CHANGED_COLOR} className="inline-flex size-6">
				<img
					src={PLACEHOLDER_ICON}
					alt=""
					width={24}
					height={24}
					className="cut-double ability-icon-light ability-icon-changed size-full"
				/>
			</CutFrame>
			<span>changed ability - click it to see what moved</span>
			<span aria-hidden className="text-gray-600">
				&middot;
			</span>
			<span className="bg-[#22222c] px-1.5 py-0.5 font-bold text-[10px] uppercase tracking-widest">
				Wording
			</span>
			<span>only reworded</span>
		</p>
	);
}
