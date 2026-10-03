// app/lib/sanitizeHtml.ts
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
function stripUnfurl(html: string): string {
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

/** Every attribute on a tag, lower-cased name -> raw value. First one wins. */
function parseAttrs(rawAttrs: string): Map<string, string> {
	const attrs = new Map<string, string>();
	ATTR_RE.lastIndex = 0;
	let match: RegExpExecArray | null = ATTR_RE.exec(rawAttrs);
	while (match !== null) {
		const name = match[1].toLowerCase();
		if (!attrs.has(name))
			attrs.set(name, match[3] ?? match[4] ?? match[5] ?? "");
		match = ATTR_RE.exec(rawAttrs);
	}
	return attrs;
}

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value.trim());

/**
 * Steam's feed points each image at a localized copy that does not exist
 * (`/<hash>/english.png` -> 404) and relies on an inline
 * `onerror="this.src=this.dataset.fallbackSrc"` to swap in the plain
 * `/<hash>.png`, which does. Inline handlers never survive sanitizing, so the
 * swap is done here instead: the fallback becomes the `src`.
 */
function resolveImgSrc(attrs: Map<string, string>) {
	const fallback = attrs.get("data-fallback-src");
	if (fallback && isHttpUrl(fallback)) attrs.set("src", fallback);
}

function keepOnly(tag: string, rawAttrs: string, allowed: string[]): string {
	if (allowed.length === 0) return "";
	const attrs = parseAttrs(rawAttrs);
	if (tag === "img") resolveImgSrc(attrs);
	const kept: string[] = [];
	for (const name of allowed) {
		const value = attrs.get(name);
		if (value !== undefined && isSafeUrl(value)) {
			kept.push(`${name}="${escapeAttr(value)}"`);
		}
	}
	// Steam's images are full-size PNGs (1.7 MB seen) far down the page, and
	// usually carry no alt. Decorative by default, and fetched only near view.
	if (tag === "img") {
		if (!attrs.has("alt")) kept.push('alt=""');
		kept.push('loading="lazy"', 'decoding="async"');
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
		const kept = keepOnly(tag, attrs, ALLOWED_ATTR[tag] ?? []);
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
