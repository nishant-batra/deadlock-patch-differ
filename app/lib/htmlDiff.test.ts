import { describe, expect, it } from "vitest";
import { renderHtmlDiff, toDiffText } from "./htmlDiff";

const hl = (text: string) => `<span class="highlight">${text}</span>`;
const ins = (html: string) =>
	`<ins class="font-medium text-gray-100 no-underline">${html}</ins>`;
const del = (text: string) =>
	`<s class="font-normal text-gray-500">${text}</s>`;

// Trimmed from the real Spirit damage icon in item-changes.json.
const SPIRIT_ICON =
	'<svg width="128" height="128" viewBox="0 0 128 128"><path d="M53.78 20.02Z" fill="white"/></svg>';
const SPIRIT_LABEL =
	'<span class="inline-attribute-label SpiritDamage">spirit damage</span>';

describe("toDiffText", () => {
	it("drops highlight markup so a re-highlighted sentence is not a rewrite (Bleed)", () => {
		const before = `Your bullets build up a ${hl("Bleed")} on enemies.`;
		const after = "Your bullets build up a Bleed on enemies.";
		expect(toDiffText(before)).toBe(toDiffText(after));
		expect(toDiffText(after)).toBe("Your bullets build up a Bleed on enemies.");
	});

	it("treats a line break as plain whitespace, so a reflow is not a rewrite", () => {
		expect(toDiffText("-15% Damage Penalty <br>Increased Spirit scaling")).toBe(
			"-15% Damage Penalty Increased Spirit scaling",
		);
		expect(toDiffText(`${hl("+1")} Charge<br>${hl("+2s")} Duration`)).toBe(
			"+1 Charge +2s Duration",
		);
	});

	it("ignores edits inside an icon's SVG", () => {
		const edited = SPIRIT_ICON.replace("M53.78", "M53.79");
		expect(toDiffText(`Your ${SPIRIT_ICON}\n${SPIRIT_LABEL}`)).toBe(
			toDiffText(`Your ${edited}\n${SPIRIT_LABEL}`),
		);
	});

	it("still sees an icon appear, and one kind of icon replace another", () => {
		const plain = toDiffText(`Your ${SPIRIT_LABEL}`);
		const svg = toDiffText(`Your ${SPIRIT_ICON} ${SPIRIT_LABEL}`);
		const img = toDiffText(`Your <img src="spirit.png"> ${SPIRIT_LABEL}`);
		const panel = toDiffText(`Your <Panel class="icon"> ${SPIRIT_LABEL}`);
		expect(new Set([plain, svg, img, panel]).size).toBe(4);
	});

	it("treats any tag the string never closes as an icon, with no mapping", () => {
		expect(toDiffText(`Range<hr class="rule">${hl("+2m")}`)).toBe(
			"Range$hr$+2m",
		);
	});
});

describe("renderHtmlDiff", () => {
	it("returns the new HTML untouched when only markup changed", () => {
		const after = `Applies ${hl("-35%")} Healing Reduction`;
		expect(renderHtmlDiff("Applies -35% Healing Reduction", after)).toBe(after);
	});

	it("marks inserted words inside the new side's highlight", () => {
		expect(
			renderHtmlDiff(
				`Applies ${hl("-35%")} Healing Reduction`,
				`Reduces ${hl("Incoming Healing")} by ${hl("-35%")}`,
			),
		).toBe(
			`${del("Applies")} ${ins("Reduces")} ` +
				`${del("-35%")} ${hl(`${ins("Incoming")} Healing`)} ` +
				`${del("Reduction")} ${ins("by ")}${hl(ins("-35%"))}`,
		);
	});

	it("keeps an unchanged highlight and line break in place", () => {
		expect(
			renderHtmlDiff(
				`${hl("2.3s")} Silence Duration <br>${hl("+35.0%")} Weapon Damage`,
				`Silences enemies for ${hl("2.3s")}<br>${hl("+35.0%")} Weapon Damage`,
			),
		).toBe(
			`${ins("Silences enemies for ")}${hl("2.3s")}${del(" Silence Duration ")}` +
				`<br>${hl("+35.0%")} Weapon Damage`,
		);
	});

	it("hides a removed icon instead of striking it", () => {
		expect(
			renderHtmlDiff(
				`Your ${SPIRIT_ICON}\n${SPIRIT_LABEL} applies`,
				`Your <img src="spirit.png">\n${SPIRIT_LABEL} applies`,
			),
		).toBe(`Your ${ins('<img src="spirit.png">')} ${SPIRIT_LABEL} applies`);
	});

	it("strikes removed words as plain text, even inside an old highlight", () => {
		const html = renderHtmlDiff(
			`Landing a ${hl("Headshot")} will reduce their ${hl("Bullet and Spirit Resist")} and applies ${hl("Healing Reduction")}.`,
			`Landing a ${hl("Headshot")} will reduce their ${hl("Bullet, Spirit Resist, and Incoming Healing")}.`,
		);
		const opened = html.match(/<span\b/g)?.length ?? 0;
		const closed = html.match(/<\/span>/g)?.length ?? 0;
		expect(opened).toBe(closed);
		expect(html).toContain(`Healing</span>${del(" Reduction")}`);
		expect(html).not.toMatch(/<s [^>]*>[^<]*<span/);
	});

	it("never splits an icon when one kind replaces another", () => {
		expect(
			renderHtmlDiff(
				`Your <img src="spirit.png"> ${SPIRIT_LABEL}`,
				`Your <Panel class="icon"> ${SPIRIT_LABEL}`,
			),
		).toBe(`Your ${ins('<Panel class="icon">')} ${SPIRIT_LABEL}`);
	});
});

describe("renderHtmlDiff - spacing", () => {
	it("separates a struck word from the word that replaced it (Ethereal Shift)", () => {
		expect(renderHtmlDiff("You enter a void", "Instantly enter a void")).toBe(
			`${del("You")} ${ins("Instantly")} enter a void`,
		);
	});

	it("keeps words apart across a removed line break", () => {
		expect(renderHtmlDiff("Resist.<br>Can be canceled.", "Resist.")).toBe(
			`Resist.${del(" Can be canceled.")}`,
		);
	});
});
