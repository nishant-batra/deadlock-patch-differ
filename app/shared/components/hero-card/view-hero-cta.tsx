import CutFrame from "#/shared/components/cut-frame";
import { AMBER_BORDER } from "#/shared/components/cut-frame/constants";

/**
 * Looks like a button but is a plain span: the whole header around it is
 * already the link, and links can't nest. Lights up on header hover, and
 * pushes itself to the header's right edge.
 */
export default function ViewHeroCta() {
	return (
		<CutFrame
			color={AMBER_BORDER}
			cut="5px"
			className="ml-auto inline-flex shrink-0"
		>
			<span className="cut-corner whitespace-nowrap py-1.5 pr-4 pl-2.5 font-bold text-xs group-hover:bg-amber-500/15">
				View hero →
			</span>
		</CutFrame>
	);
}
