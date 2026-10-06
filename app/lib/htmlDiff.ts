// app/lib/htmlDiff.ts
//
// Game descriptions are HTML: highlighted spans, inline icons, line breaks.
// Comparing that HTML directly reports markup churn as a rewrite - 11 of 41
// observed loc_string "changes" were nothing but inline SVG edits - so a
// description is flattened to plain text for diffing, and the markup is put
// back around the word diff when it is shown.

import { diffWords } from "#/shared/utils/wordDiff";

/** A tag that takes no room in the flattened text, e.g. `<span …>` / `</span>`. */
type Mark = { at: number; html: string; closing: boolean };

/** An icon / line break: the HTML it came from and its placeholder's length. */
type Atom = { html: string; length: number };

type Flattened = {
	text: string;
	marks: Mark[];
	/** Text offset where each atom's placeholder starts. */
	atoms: Map<number, Atom>;
};

const PIECE = /<svg\b[\s\S]*?<\/svg>|<\/?([a-zA-Z][\w-]*)[^>]*>|[^<]+|</gi;

/**
 * Tags that draw something with no text of their own: icons (the game's
 * `<Panel>` is one) and line breaks. `<svg>` is matched whole, insides and all.
 */
const ATOMS = new Set(["img", "br", "panel"]);

/**
 * An icon or line break flattens to `$name$`, so one kind of icon replacing
 * another still counts as a change. Every other tag (`<span>`, and anything
 * new) is a wrapper that takes no room in the text, closed or not: Valve
 * leaves some `<span>`s unclosed and closes some `<Panel>`s, so whether a
 * string closes a tag says nothing about what the tag is.
 */
function flattenHtml(html: string): Flattened {
	let text = "";
	const marks: Mark[] = [];
	const atoms = new Map<number, Atom>();
	let lastAtom: { at: number; atom: Atom } | undefined;
	for (const [piece, name] of String(html).matchAll(PIECE)) {
		const tag = name?.toLowerCase();
		const closing = piece.startsWith("</");
		const isSvg = /^<svg\b/i.test(piece);
		const openAtom =
			closing && lastAtom && lastAtom.at + lastAtom.atom.length === text.length
				? lastAtom.atom
				: undefined;
		if (tag && ATOMS.has(tag) && openAtom) {
			// `</Panel>` right after its icon goes out with it.
			openAtom.html += piece;
		} else if (isSvg || (tag && ATOMS.has(tag) && (!closing || tag === "br"))) {
			// Browsers read a stray `</br>` as a line break too.
			const placeholder = `$${isSvg ? "svg" : tag}$`;
			const atom = { html: piece, length: placeholder.length };
			atoms.set(text.length, atom);
			lastAtom = { at: text.length, atom };
			text += placeholder;
		} else if (tag && ATOMS.has(tag)) {
			// Any other stray closer (`</Panel>`, `</img>`) closes nothing.
		} else if (tag) {
			marks.push({ at: text.length, html: piece, closing });
		} else {
			text += piece.replace(/\s+/g, " ");
		}
	}
	return { text, marks, atoms };
}

/**
 * The string two descriptions are compared by. Line breaks count as plain
 * whitespace here, so a reflowed sentence is not a rewrite.
 */
export const toDiffText = (html: string) =>
	flattenHtml(html).text.replaceAll("$br$", " ").replace(/\s+/g, " ").trim();

const INSERT_OPEN = '<ins class="font-medium text-gray-100 no-underline">';
const DELETE_OPEN = '<s class="font-normal text-gray-500">';

/** Whitespace, or a line break placeholder, at either end of a run. */
const SPACE_AT_START = /^(\s|\$br\$)/;
const SPACE_AT_END = /(\s|\$br\$)$/;

/**
 * The new description's HTML with the word diff woven in: added words
 * emphasised, removed words struck through in place.
 *
 * Only the new side's tags are written verbatim - that HTML is already
 * balanced. Struck-out words are plain text, always grey and regular weight,
 * so a removed highlight cannot pass for live copy. Removed icons are hidden
 * rather than struck; a removed line break becomes a space so the words
 * around it do not run together.
 *
 * A word swapped for another ("You" -> "Instantly") has no whitespace of its
 * own between the struck and the added word - both spaces around it are
 * unchanged - so one is added there to keep them from reading as one word.
 */
export function renderHtmlDiff(before: string, after: string): string {
	const old = flattenHtml(before);
	const next = flattenHtml(after);
	let out = "";
	let oldAt = 0;
	let newAt = 0;
	let nextMark = 0;

	const flushNewMarks = (closingOnly: boolean) => {
		while (nextMark < next.marks.length) {
			const { at, html, closing } = next.marks[nextMark];
			if (at > newAt || (closingOnly && !closing)) return;
			out += html;
			nextMark++;
		}
	};

	// The last run written, to tell when a struck and an added word touch.
	let previous: { op: "insert" | "delete"; text: string } | undefined;
	const touches = (before: string, after: string) =>
		!SPACE_AT_END.test(before) && !SPACE_AT_START.test(after);

	for (const { op, text } of diffWords(old.text, next.text)) {
		if (op === "delete") {
			// Close what ends here first, so struck words sit outside the
			// highlight of the word before them.
			flushNewMarks(true);
			const end = oldAt + text.length;
			let struck = "";
			for (let at = oldAt; at < end; ) {
				const atom = old.atoms.get(at);
				if (!atom) struck += old.text[at];
				else if (/^<br/i.test(atom.html)) struck += " ";
				at += atom?.length ?? 1;
			}
			oldAt = end;
			// Nothing left but hidden icons and spacing the new side already has.
			if (!/\S/.test(struck)) continue;
			if (previous?.op === "insert" && touches(previous.text, struck)) {
				out += " ";
			}
			out += `${DELETE_OPEN}${struck}</s>`;
			previous = { op, text: struck };
			continue;
		}

		if (
			op === "insert" &&
			previous?.op === "delete" &&
			touches(previous.text, text)
		) {
			out += " ";
		}
		previous = op === "insert" ? { op, text } : undefined;

		const end = newAt + text.length;
		while (newAt < end) {
			flushNewMarks(false);
			const atom = next.atoms.get(newAt);
			const html = atom?.html ?? next.text[newAt];
			const length = atom?.length ?? 1;
			out += op === "insert" ? `${INSERT_OPEN}${html}</ins>` : html;
			newAt += length;
			if (op === "equal") oldAt += length;
		}
	}
	flushNewMarks(false);

	return out.replaceAll(`</ins>${INSERT_OPEN}`, "");
}
