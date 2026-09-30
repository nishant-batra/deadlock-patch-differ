import { describe, expect, it } from "vitest";
import type { Item, TooltipSection } from "#/types";
import {
	isStatusEffectKey,
	listedTooltipKeys,
	statusEffectDurationKey,
	statusEffectDurations,
} from "./statusEffects";

const props = (values: Record<string, string | number>): Item["properties"] =>
	Object.fromEntries(
		Object.entries(values).map(([key, value]) => [key, { value }]),
	);

const section = (
	buckets: Partial<
		Record<
			"important_properties" | "elevated_properties" | "properties",
			string[]
		>
	>,
): TooltipSection =>
	({ section_type: "active", section_attributes: [buckets] }) as TooltipSection;

describe("listedTooltipKeys", () => {
	it("unions every bucket of every section", () => {
		const keys = listedTooltipKeys([
			section({ important_properties: ["A"], properties: ["B"] }),
			section({ elevated_properties: ["C"], properties: ["A"] }),
		]);
		expect([...keys].sort()).toEqual(["A", "B", "C"]);
	});

	it("handles missing sections", () => {
		expect(listedTooltipKeys(undefined).size).toBe(0);
	});
});

describe("isStatusEffectKey", () => {
	it("matches only StatusEffect keys", () => {
		expect(isStatusEffectKey("StatusEffectStun")).toBe(true);
		expect(isStatusEffectKey("StunDuration")).toBe(false);
	});
});

describe("statusEffectDurationKey", () => {
	it("prefers the effect's own duration (Knockdown: Stun -> StunDuration)", () => {
		const key = statusEffectDurationKey(
			"StatusEffectStun",
			props({ StunDuration: "0.5", AbilityDuration: "0", StunDelay: "2" }),
			new Set(["StatusEffectStun"]),
		);
		expect(key).toBe("StunDuration");
	});

	it("maps EMP to SilenceDuration (Silencer)", () => {
		const key = statusEffectDurationKey(
			"StatusEffectEMP",
			props({ SilenceDuration: "2.5", AbilityDuration: "0" }),
			new Set(),
		);
		expect(key).toBe("SilenceDuration");
	});

	it("falls back to AbilityDuration (Focus Lens)", () => {
		const key = statusEffectDurationKey(
			"StatusEffectEMP",
			props({ AbilityDuration: "4.5" }),
			new Set(),
		);
		expect(key).toBe("AbilityDuration");
	});

	it("returns nothing when the duration already has its own line (Disarming Hex)", () => {
		const key = statusEffectDurationKey(
			"StatusEffectDisarmed",
			props({ AbilityDuration: "4.25" }),
			new Set(["AbilityDuration"]),
		);
		expect(key).toBeUndefined();
	});

	it("does not fall through to AbilityDuration when the first match is listed", () => {
		const key = statusEffectDurationKey(
			"StatusEffectStun",
			props({ StunDuration: "0.5", AbilityDuration: "3" }),
			new Set(["StunDuration"]),
		);
		expect(key).toBeUndefined();
	});

	it("returns nothing for a zero duration (Phantom Strike)", () => {
		const key = statusEffectDurationKey(
			"StatusEffectDisarmed",
			props({ AbilityDuration: "0" }),
			new Set(),
		);
		expect(key).toBeUndefined();
	});
});

describe("statusEffectDurations", () => {
	it("maps every badge that has a duration", () => {
		const durations = statusEffectDurations({
			properties: props({ StunDuration: "0.5", AbilityCastRange: "20m" }),
			tooltip_sections: [
				section({
					important_properties: ["StatusEffectStun"],
					properties: ["AbilityCastRange"],
				}),
			],
		});
		expect([...durations]).toEqual([["StatusEffectStun", "StunDuration"]]);
	});
});
