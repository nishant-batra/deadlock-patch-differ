import { describe, expect, it } from "vitest";
import {
	generalHtml,
	hasGeneralContent,
	splitSections,
	titleDate,
} from "./noteSections";

// Headings are written `\[ General ]` in the feed - a literal backslash.
const heading = (name: string) => `<p><b>\\[ ${name} ]</b></p>`;

const HEADED = [
	heading("General"),
	"<p>- Urn now spawns at mid</p>",
	heading("Items"),
	"<p>- Toxic Bullets: Cost increased</p>",
	heading("Heroes"),
	"<p>- Haze: Bullet damage increased</p>",
	heading("Urn / King of the Hill"),
	"<p>- Capture time reduced</p>",
].join("");

const KNOWN = new Set(["Haze", "Toxic Bullets"]);

describe("splitSections", () => {
	it("splits a headed note into named sections in order", () => {
		expect(splitSections(HEADED).map(({ name }) => name)).toEqual([
			"General",
			"Items",
			"Heroes",
			"Urn / King of the Hill",
		]);
	});

	it("keeps text before the first heading as an unnamed preamble", () => {
		expect(splitSections(`<p>Intro</p>${heading("General")}<p>x</p>`)).toEqual([
			{ name: null, html: "<p>Intro</p>" },
			{ name: "General", html: "<p>x</p>" },
		]);
	});

	it("does not mistake long bracketed prose for a heading", () => {
		const prose = `<p>[ ${"a".repeat(45)} ]</p>`;
		expect(splitSections(prose)).toEqual([{ name: null, html: prose }]);
	});
});

describe("generalHtml", () => {
	it("drops the Items and Heroes sections of a headed note", () => {
		const html = generalHtml(HEADED, KNOWN);
		expect(html).toBe(
			"<p>- Urn now spawns at mid</p><p>- Capture time reduced</p>",
		);
	});

	it("drops lines naming a known hero or item in an unheaded <br> note (Minor Update 08-12 shape)", () => {
		const html = generalHtml(
			"<p>- Haze: Bullet damage increased<br>- Urn: Delivery time reduced<br>- Toxic Bullets: Cost increased</p>",
			KNOWN,
		);
		expect(html).toContain("Urn: Delivery time reduced");
		expect(html).not.toContain("Haze");
		expect(html).not.toContain("Toxic Bullets");
	});

	it("returns an empty string for an empty note", () => {
		expect(generalHtml("", KNOWN)).toBe("");
	});
});

describe("hasGeneralContent", () => {
	it("is false when every line was hero or item balance", () => {
		expect(
			hasGeneralContent("<p>- Haze: Bullet damage increased</p>", KNOWN),
		).toBe(false);
	});

	it("is true when a general line survives", () => {
		expect(hasGeneralContent(HEADED, KNOWN)).toBe(true);
	});
});

describe("titleDate", () => {
	it("reads the MM-DD-YYYY date embedded in a balance note title", () => {
		expect(titleDate("Minor Update - 09-16-2026")).toBe("2026-09-16");
	});

	it("returns null for titles without a date", () => {
		expect(titleDate("City Never Sleeps")).toBeNull();
	});
});
