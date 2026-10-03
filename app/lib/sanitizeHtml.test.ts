import { describe, expect, it } from "vitest";
import { sanitizeNotesHtml } from "./sanitizeHtml";

const STEAM_IMG =
	'<img src="https://clan.fastly.steamstatic.com/images/45164767/abc/english.png" ' +
	'data-fallback-src="https://clan.fastly.steamstatic.com/images/45164767/abc.png" ' +
	'onerror="this.onerror=null; this.src=this.dataset.fallbackSrc;">';

describe("sanitizeNotesHtml - images", () => {
	it("swaps in Steam's fallback image and drops the inline handler", () => {
		expect(sanitizeNotesHtml(STEAM_IMG)).toBe(
			'<img src="https://clan.fastly.steamstatic.com/images/45164767/abc.png" alt="" loading="lazy" decoding="async" />',
		);
	});

	it("keeps src when there is no fallback", () => {
		expect(sanitizeNotesHtml('<img src="https://x.test/a.png" alt="A">')).toBe(
			'<img src="https://x.test/a.png" alt="A" loading="lazy" decoding="async" />',
		);
	});

	it("ignores a non-http fallback", () => {
		expect(
			sanitizeNotesHtml(
				'<img src="https://x.test/a.png" data-fallback-src="javascript:alert(1)">',
			),
		).toBe(
			'<img src="https://x.test/a.png" alt="" loading="lazy" decoding="async" />',
		);
	});

	it("still drops unsafe src values", () => {
		expect(sanitizeNotesHtml('<img src="javascript:alert(1)">')).toBe(
			'<img alt="" loading="lazy" decoding="async" />',
		);
	});
});

describe("sanitizeNotesHtml - general", () => {
	it("strips scripts and event handlers, unwraps unknown tags", () => {
		expect(
			sanitizeNotesHtml(
				'<div onclick="x()"><p>Hi</p><script>bad()</script><a href="https://a.test" target="_blank">l</a></div>',
			),
		).toBe('<p>Hi</p><a href="https://a.test">l</a>');
	});
});
