import type { HeroDescription } from "#/types";

/**
 * The hero's playstyle blurb and lore. Lore is long (several paragraphs) and
 * is flavour, not stats, so it sits behind a collapsed `<details>` - still in
 * the HTML for crawlers. 13 of the 39 live heroes ship lore only.
 */
export default function HeroAbout({
	description: { playstyle, lore },
}: {
	description: HeroDescription;
}) {
	if (!playstyle && !lore) return null;

	return (
		<section className="mb-8 flex flex-col gap-3">
			{playstyle && (
				// Sinclair's ships an inline `<i>` around their name - drop the tags
				// rather than render them as literal text.
				<p className="text-gray-200">{playstyle.replace(/<[^>]+>/g, "")}</p>
			)}
			{lore && (
				<details className="rounded-md bg-[#1b1b24] px-3 py-2">
					<summary className="cursor-pointer select-none font-bold text-gray-300 text-sm">
						Lore
					</summary>
					<div className="mt-2 flex flex-col gap-2 text-gray-300 text-sm">
						{lore
							.split(/\n\s*\n/)
							.filter((paragraph) => paragraph.trim())
							.map((paragraph) => (
								<p key={paragraph}>{paragraph}</p>
							))}
					</div>
				</details>
			)}
		</section>
	);
}
