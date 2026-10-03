import { describe, expect, it } from "vitest";
import type { Hero } from "#/types";
import { accentOf, textOn } from "./heroAccent";

const withColor = (style_hex?: string) =>
	({ colors: style_hex ? { style_hex } : undefined }) as Hero;

describe("accentOf", () => {
	it("uses the hero's theme colour", () => {
		expect(accentOf(withColor("#653cbc"))).toBe("#653cbc");
	});

	it("falls back when the colour is missing or malformed", () => {
		expect(accentOf(withColor())).toBe("#3a3a48");
		expect(accentOf(withColor("red"))).toBe("#3a3a48");
	});
});

describe("textOn", () => {
	it("picks white on dark theme colours (Rat King, Violet)", () => {
		expect(textOn("#733033")).toBe("#ffffff");
		expect(textOn("#653cbc")).toBe("#ffffff");
	});

	it("picks dark text on pale theme colours (Solomon)", () => {
		expect(textOn("#AA9E7E")).toBe("#111118");
	});
});
