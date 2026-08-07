/**
 * A prose rewrite. Deadlock writes balance numbers into the description text -
 * Cultist Sacrifice went "150% Bonus Souls" to "180%" without any property
 * value moving - so this is a first-class change, not a footnote.
 *
 * Both sides are plain text: the projection strips tags before comparing, so
 * what arrives here is already safe and carries no markup to render.
 */
export default function TextChange({
	before,
	after,
}: {
	before: string;
	after: string;
}) {
	return (
		<div className="flex flex-col gap-0.5 px-2 py-1 text-sm">
			<span className="font-medium text-gray-400 text-xs uppercase tracking-wide">
				Description
			</span>
			{before && <s className="text-gray-500">{before}</s>}
			<span className="text-gray-200">{after}</span>
		</div>
	);
}
