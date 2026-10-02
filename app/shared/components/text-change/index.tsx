import { renderHtmlDiff } from "#/lib/htmlDiff";

/**
 * A prose rewrite, diffed at the word level. Deadlock writes balance changes
 * into the description text - Fury Trance gained a whole "Move Speed" clause,
 * Cultist Sacrifice went "150%" to "180%" - and those edits are almost always a
 * small insertion inside an otherwise identical sentence. Striking the whole old
 * line and printing the whole new one buries that, so only the words that moved
 * are marked: removed words struck through, added words emphasised.
 *
 * Both sides are the game's own description HTML, rendered with its icons and
 * highlights - the same first-party copy the tooltip body renders.
 *
 * Neutral treatment on purpose: the stat rows on this same card use emerald/rose
 * for buff/nerf, so colouring prose green/red would imply a direction the text
 * itself does not carry.
 */
export default function TextChange({
	before,
	after,
}: {
	before: string;
	after: string;
}) {
	return (
		<div className="px-2 py-1 text-sm leading-relaxed">
			<span className="font-medium text-gray-400 text-xs uppercase tracking-wide">
				Description
			</span>
			<p
				className="mt-0.5 text-gray-400"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: first-party API copy
				dangerouslySetInnerHTML={{ __html: renderHtmlDiff(before, after) }}
			/>
		</div>
	);
}
