import type { PatchNote } from "#/types";

/**
 * A Steam note's general content. Item and hero sections are stripped at
 * ingest - they are already rendered as diff cards, and duplicating them as
 * raw text was the whole reason for this split.
 */
export default function GeneralNote({ note }: { note: PatchNote }) {
	const { source, html, link } = note;
	return (
		<article className="prose prose-invert max-w-none [overflow-wrap:anywhere]">
			<p className="text-gray-400 text-sm">
				<span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
					{source}
				</span>
			</p>
			{/* Sanitized at ingest by app/lib/sanitizeHtml.ts. */}
			<div
				// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized at ingest
				dangerouslySetInnerHTML={{ __html: html }}
			/>
			<a href={link} target="_blank" rel="noreferrer">
				View original
			</a>
		</article>
	);
}
