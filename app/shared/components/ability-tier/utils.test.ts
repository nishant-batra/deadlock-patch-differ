import { describe, expect, it } from "vitest";
import type { TierDiff } from "#/types";
import { formatTierBonus, isTierTouched } from "./utils";

describe("formatTierBonus", () => {
	it("signs a positive bonus and appends its unit", () => {
		expect(formatTierBonus(10, { postfix: "%" })).toBe("+10%");
		expect(formatTierBonus("1.5", { postfix: "s" })).toBe("+1.5s");
	});

	it("keeps a negative bonus's own sign", () => {
		expect(formatTierBonus(-5, { postfix: "s" })).toBe("-5s");
	});

	it("does not double an existing + or unit", () => {
		expect(formatTierBonus("+3", {})).toBe("+3");
		expect(formatTierBonus("70m", { postfix: "m" })).toBe("+70m");
	});

	it("trims float noise", () => {
		expect(formatTierBonus(0.12345, {})).toBe("+0.123");
	});
});

const tier = (overrides: Partial<TierDiff>): TierDiff => ({
	tier: 1,
	rows: [],
	...overrides,
});

describe("isTierTouched", () => {
	it("is false when every row is equal and the copy is unchanged", () => {
		expect(
			isTierTouched(
				tier({ rows: [{ key: "a", label: "A", kind: "equal", new: 1 }] }),
			),
		).toBe(false);
	});

	it("is true when a bonus moved or the tier text was rewritten", () => {
		expect(
			isTierTouched(
				tier({
					rows: [{ key: "a", label: "A", kind: "changed", old: 1, new: 2 }],
				}),
			),
		).toBe(true);
		expect(isTierTouched(tier({ text: { old: "a", new: "b" } }))).toBe(true);
	});
});
