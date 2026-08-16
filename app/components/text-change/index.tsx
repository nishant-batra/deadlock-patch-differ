import { diffWords } from "#/utils/wordDiff";

/**
 * A prose rewrite, diffed at the word level. Deadlock writes balance changes
 * into the description text - Fury Trance gained a whole "Move Speed" clause,
 * Cultist Sacrifice went "150%" to "180%" - and those edits are almost always a
 * small insertion inside an otherwise identical sentence. Striking the whole old
 * line and printing the whole new one buries that, so only the words that moved
 * are marked: removed words struck through, added words emphasised.
 *
 * Both sides are plain text - the projection strips tags before comparing - so
 * there is no markup to render and nothing unsafe here.
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
			<p className="mt-0.5">
				{diffWords(before, after).map((part, index) => {
					if (part.op === "delete") {
						return (
							// biome-ignore lint/suspicious/noArrayIndexKey: derived from static payload text, never reorders
							<s key={index} className="text-gray-500">
								{part.text}
							</s>
						);
					}
					if (part.op === "insert") {
						return (
							// biome-ignore lint/suspicious/noArrayIndexKey: derived from static payload text, never reorders
							<span key={index} className="font-medium text-gray-100">
								{part.text}
							</span>
						);
					}
					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: derived from static payload text, never reorders
						<span key={index} className="text-gray-400">
							{part.text}
						</span>
					);
				})}
			</p>
		</div>
	);
}
