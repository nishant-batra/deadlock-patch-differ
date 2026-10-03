import { describe, expect, it } from "vitest";
import type { Item } from "#/types";
import { allStatRows } from "./utils";

const ABILITY = {
	name: "Sleep Dagger",
	properties: {
		DotDamage: { value: "20", label: "Damage" },
		AbilityCooldown: { value: "30" },
		HiddenThing: { value: "5" },
		SlowPercent: { value: "25", label: "Slow" },
		UnusedCharges: { value: "0" },
		EmptyText: { value: "" },
	},
	tooltip_details: {
		info_sections: [{ basic_properties: ["DotDamage"] }],
	},
} as unknown as Item;

describe("allStatRows", () => {
	it("lists non-zero off-card properties, labelled ones first", () => {
		expect(
			allStatRows(ABILITY).map(({ key, label, labelled }) => [
				key,
				label,
				labelled,
			]),
		).toEqual([
			["SlowPercent", "Slow", true],
			["HiddenThing", "Hidden Thing", false],
		]);
	});

	it("is empty for an ability with no properties", () => {
		expect(allStatRows({ name: "x" } as unknown as Item)).toEqual([]);
	});
});
