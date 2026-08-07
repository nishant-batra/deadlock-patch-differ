// app/utils/sanitizeHtml.ts
//
// Runs at INGEST, never in the browser - this is the only place untrusted
// third-party HTML (forum / Steam patch notes) enters the app.
//
// The allowlist is a deliberate superset of what the feed currently uses
// (`a b br div h3 img p span u`) because the game is in alpha and the notes
// format can change without warning. Unknown tags are UNWRAPPED, not dropped,
// so new formatting degrades to plain text instead of vanishing.

const ALLOWED = new Set([
	"a",
	"b",
	"br",
	"code",
	"em",
	"h2",
	"h3",
	"h4",
	"i",
	"img",
	"li",
	"ol",
	"p",
	"pre",
	"span",
	"strong",
	"u",
	"ul",
]);

const ALLOWED_ATTR: Record<string, string[]> = {
	a: ["href"],
	img: ["src", "alt"],
};

const VOID_TAGS = new Set(["br", "img"]);

/**
 * XenForo link-unfurl cards: `<div class="bbCodeBlock ... js-unfurl ...">...</div>`.
 * They carry no prose, only a preview of a link we already render separately.
 */
const UNFURL_OPEN_RE = /<div\b[^>]*\bjs-unfurl\b[^>]*>/i;

/** Removes an unfurl `<div>` and everything up to its matching close tag. */
export function stripUnfurl(html: string): string {
	let out = html;
	for (;;) {
		const match = UNFURL_OPEN_RE.exec(out);
		if (!match || match.index === undefined) return out;
		const start = match.index;
		let depth = 1;
		const tagRe = /<(\/?)div\b[^>]*>/gi;
		tagRe.lastIndex = start + match[0].length;
		let end = out.length;
		let hit: RegExpExecArray | null = tagRe.exec(out);
		while (hit !== null) {
			depth += hit[1] === "/" ? -1 : 1;
			if (depth === 0) {
				end = hit.index + hit[0].length;
				break;
			}
			hit = tagRe.exec(out);
		}
		out = out.slice(0, start) + out.slice(end);
	}
}

const SCRIPTISH_RE = /<(script|style|iframe)\b[\s\S]*?<\/\1\s*>/gi;
const COMMENT_RE = /<!--[\s\S]*?-->/g;
const TAG_RE = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*?)(\/?)>/g;
const ATTR_RE =
	/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;

const escapeAttr = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

/** `javascript:` / `data:` URLs never survive. */
const isSafeUrl = (value: string) => {
	// Whitespace and control chars go first - `java&#10;script:` is a real trick.
	const bare = Array.from(value)
		.filter((ch) => ch.charCodeAt(0) > 32)
		.join("");
	return !/^(javascript|data|vbscript):/i.test(bare);
};

function keepOnly(rawAttrs: string, allowed: string[]): string {
	if (allowed.length === 0) return "";
	const kept: string[] = [];
	ATTR_RE.lastIndex = 0;
	let match: RegExpExecArray | null = ATTR_RE.exec(rawAttrs);
	while (match !== null) {
		const name = match[1].toLowerCase();
		const value = match[3] ?? match[4] ?? match[5] ?? "";
		if (allowed.includes(name) && isSafeUrl(value)) {
			kept.push(`${name}="${escapeAttr(value)}"`);
		}
		match = ATTR_RE.exec(rawAttrs);
	}
	return kept.length > 0 ? ` ${kept.join(" ")}` : "";
}

export function sanitizeNotesHtml(raw: string): string {
	if (!raw) return "";
	const html = stripUnfurl(raw)
		.replace(SCRIPTISH_RE, "")
		.replace(COMMENT_RE, "");

	return html.replace(TAG_RE, (full: string, rawTag: string, attrs: string) => {
		const tag = rawTag.toLowerCase();
		// Unknown tag: unwrap - keep the children, drop the tag itself.
		if (!ALLOWED.has(tag)) return "";
		if (full.startsWith("</")) return `</${tag}>`;
		const kept = keepOnly(attrs, ALLOWED_ATTR[tag] ?? []);
		return VOID_TAGS.has(tag) ? `<${tag}${kept} />` : `<${tag}${kept}>`;
	});
}

export const stripTags = (html: string) =>
	html
		.replace(SCRIPTISH_RE, "")
		.replace(/<[^>]*>/g, " ")
		.replace(/&nbsp;/gi, " ")
		.replace(/\s+/g, " ");

/**
 * Finding #3: neither source is trusted to carry prose - the newest forum entry
 * in the live feed is nothing but a Steam link-unfurl card. Test, don't assume.
 */
export const hasProse = (html: string) =>
	stripTags(stripUnfurl(html ?? "")).trim().length > 40;

/** `- Urn Runner ...` inside a `<p>` - the Steam notes' bullet convention. */
export const looksLikeBullet = (text: string) => /^\s*-\s+/.test(text);
