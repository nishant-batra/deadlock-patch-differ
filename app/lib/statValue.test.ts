import { describe, expect, it } from "vitest";
import { isEmptyStatValue } from "./statValue";

describe("isEmptyStatValue", () => {
	it.each([
		undefined,
		null,
		"",
		0,
		"0",
		"0.0",
		"0m",
		"0s",
		"0%",
		"0 m",
	])("treats %j as empty", (value) => {
		expect(isEmptyStatValue(value)).toBe(true);
	});

	it.each([
		5,
		"5",
		"2.5m",
		"-19",
		"0.05",
		"0 / 0.75",
		"0 / 0",
		"m",
		"Slows",
		["A"],
	])("treats %j as a real value", (value) => {
		expect(isEmptyStatValue(value)).toBe(false);
	});
});
