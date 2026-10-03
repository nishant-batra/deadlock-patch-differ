import { describe, expect, it } from "vitest";
import {
	isPlaceholderZero,
	resolvePrefix,
	shouldAppendPostfix,
} from "./statFormatting";

describe("resolvePrefix", () => {
	it("converts the API's sign token into a literal +", () => {
		expect(resolvePrefix("{s:sign}")).toBe("+");
	});

	it("passes other prefixes through and blanks a missing one", () => {
		expect(resolvePrefix("-")).toBe("-");
		expect(resolvePrefix(undefined)).toBe("");
	});
});

describe("shouldAppendPostfix", () => {
	it("appends a unit the value does not already carry", () => {
		expect(shouldAppendPostfix("-35", "%")).toBe(true);
	});

	it("skips a unit the value already ends with", () => {
		expect(shouldAppendPostfix("35%", "%")).toBe(false);
	});

	it("never appends a metre postfix, even with a leading space", () => {
		expect(shouldAppendPostfix("70m", " m")).toBe(false);
		expect(shouldAppendPostfix(70, "m")).toBe(false);
	});

	it("is false without a postfix", () => {
		expect(shouldAppendPostfix(5, undefined)).toBe(false);
	});
});

describe("isPlaceholderZero", () => {
	it("hides an unchanged 0", () => {
		expect(isPlaceholderZero({ value: "0" }, false)).toBe(true);
		expect(isPlaceholderZero({ value: 0 }, false)).toBe(true);
	});

	it("keeps a 0 that changed or that Valve elevated", () => {
		expect(isPlaceholderZero({ value: 0 }, true)).toBe(false);
		expect(
			isPlaceholderZero({ value: 0, tooltip_is_elevated: true }, false),
		).toBe(false);
	});

	it("keeps non-zero values", () => {
		expect(isPlaceholderZero({ value: "0.5" }, false)).toBe(false);
	});
});
