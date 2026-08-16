// app/utils/noteSections.ts
//
// Splits a Steam patch note into its sections so the General block can render
// everything EXCEPT the item and hero changes - those already appear as diff
// cards, and showing them again as raw text is duplication.
//
// Two note shapes exist in the live feed, and both have to work:
//
//   1. HEADED  - `<b>\[ General ]</b>` … `<b>\[ Items ]</b>` … `<b>\[ Heroes ]</b>`
//      Only five heading names exist across the whole 30-entry feed: General,
//      Heroes, Items, Map Changes, Urn / King of the Hill. So "drop Items and
//      Heroes, keep everything else" stays correct even if a new heading shows up.
//
//   2. UNHEADED - a flat list of `- Subject: change` lines with no headings at
//      all. Minor Update 08-12 is 28 of 31 lines of hero balance this way. There
//      is no structure to filter on, so lines are matched against the real hero
//      and item names instead.
//
// Deliberately no regex against the raw HTML tags: an escaping bug in a
// `<b>\[…]</b>` pattern silently matched nothing during the dry run. Chunking
// and comparing plain text is harder to get quietly wrong.

import { stripTags } from "./sanitizeHtml";

/** Sections whose content is already rendered as diff cards. */
const DROP = new Set(["items", "heroes"]);

/** Longest real heading is "Urn / King of the Hill"; anything longer is prose. */
const MAX_HEADING = 40;

/** Subject is the text before the first colon, e.g. `- Apollo: …`. */
const MAX_SUBJECT = 40;

export type NoteSection = {
	/** `null` for the preamble before any heading. */
	name: string | null;
	html: string;
};

/**
 * Minor Update 08-12 is a single `<p>` using `<br>` separators, so splitting on
 * `</p>` alone yields one chunk and every line filter becomes a no-op. Both
 * separators are needed.
 */
export const chunks = (html: string): string[] =>
	html
		.split(/(?<=<\/p>)|(?<=<br\s*\/?>)/i)
		.filter((chunk) => chunk.trim());

/**
 * The heading name if this chunk is one, else `null`. The feed writes headings
 * as `\[ General ]` - a literal backslash before the bracket.
 */
export function headingName(chunkHtml: string): string | null {
	let text = stripTags(chunkHtml).trim();
	if (text.startsWith("\\")) text = text.slice(1).trim();
	if (!text.startsWith("[") || !text.endsWith("]")) return null;
	const inner = text.slice(1, -1).trim();
	return inner.length > 0 && inner.length <= MAX_HEADING ? inner : null;
}

/** Sections in document order. An unheaded note yields one `name: null` entry. */
export function splitSections(html: string): NoteSection[] {
	const sections: NoteSection[] = [];
	let current: NoteSection = { name: null, html: "" };

	for (const chunk of chunks(html)) {
		const name = headingName(chunk);
		if (name) {
			if (current.name !== null || current.html.trim()) sections.push(current);
			current = { name, html: "" };
		} else {
			current.html += chunk;
		}
	}
	if (current.name !== null || current.html.trim()) sections.push(current);
	return sections;
}

/** `- Apollo: Riposte …` -> `Apollo`, else `null`. */
const subjectOf = (chunkHtml: string): string | null => {
	const text = stripTags(chunkHtml)
		.replace(/^[-\s]+/, "")
		.trim();
	const colon = text.indexOf(":");
	if (colon <= 0 || colon > MAX_SUBJECT) return null;
	return text.slice(0, colon).trim();
};

/**
 * The note HTML with item and hero content removed.
 *
 * A headed note is filtered by section. An unheaded one has no structure to use,
 * so each line is dropped when its subject is a known hero or shop item -
 * measured on Minor Update 07-09, that drops 39 balance lines and keeps the 15
 * genuine Urn/general ones.
 */
export function generalHtml(html: string, knownNames: Set<string>): string {
	if (!html) return "";

	const sections = splitSections(html);
	if (sections.some((section) => section.name)) {
		return sections
			.filter(
				(section) => !section.name || !DROP.has(section.name.toLowerCase()),
			)
			.map((section) => section.html)
			.join("");
	}

	return chunks(html)
		.filter((chunk) => {
			const subject = subjectOf(chunk);
			return !(subject && knownNames.has(subject));
		})
		.join("");
}

/** True when anything readable survives the filter. */
export const hasGeneralContent = (html: string, knownNames: Set<string>) =>
	stripTags(generalHtml(html, knownNames)).trim().length > 0;

/**
 * The join key between a note and the build it describes: the feed carries no
 * build number, but a balance note's title embeds its date as `MM-DD-YYYY`.
 * Returns an ISO `YYYY-MM-DD`, or `null` for titles like "Matchmaking Update".
 */
export function titleDate(title: string): string | null {
	const match = title.match(/(\d{2})-(\d{2})-(\d{4})/);
	if (!match) return null;
	const [, month, day, year] = match;
	return `${year}-${month}-${day}`;
}
