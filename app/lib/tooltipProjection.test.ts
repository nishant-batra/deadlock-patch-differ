import { describe, expect, it } from "vitest";
import type { Item, ItemProperty, TooltipSection } from "#/types";
import { diffItems } from "./tooltipProjection";

type Buckets = Partial<
	Record<
		"important_properties" | "elevated_properties" | "properties",
		string[]
	>
> & { important_properties_with_icon?: unknown[] };

const section = (type: string, ...attributes: Buckets[]): TooltipSection =>
	({ section_type: type, section_attributes: attributes }) as TooltipSection;

const item = (
	properties: Record<string, Partial<ItemProperty>>,
	sections: TooltipSection[],
): Item =>
	({
		name: "Test Item",
		cost: 3200,
		properties,
		tooltip_sections: sections,
	}) as unknown as Item;

const stun = (value = "0.5") => ({
	value,
	label: "Stun Duration",
	postfix: "s",
});

describe("diffItems - status badges", () => {
	it("ignores a duration that moved from its own line into the badge (Knockdown)", () => {
		const before = item({ StunDuration: stun() }, [
			section("active", {
				important_properties: ["StatusEffectStun", "StunDuration"],
			}),
		]);
		const after = item({ StunDuration: stun() }, [
			section("active", { important_properties: ["StatusEffectStun"] }),
		]);
		expect(diffItems(before, after)).toEqual([]);
	});

	it("reports a duration that changed inside the badge", () => {
		const before = item({ StunDuration: stun("0.5") }, [
			section("active", { important_properties: ["StatusEffectStun"] }),
		]);
		const after = item({ StunDuration: stun("0.75") }, [
			section("active", { important_properties: ["StatusEffectStun"] }),
		]);
		expect(diffItems(before, after)).toEqual([
			expect.objectContaining({
				kind: "stat",
				key: "StunDuration",
				old: "0.5",
				new: "0.75",
			}),
		]);
	});
});

describe("diffItems - rows judged by value, not listing", () => {
	it("ignores a row that left the tooltip while the stat kept its value (Return Fire)", () => {
		const properties = {
			BulletResist: { value: "10", label: "Bullet Resist" },
		};
		const before = item(properties, [
			section("innate", { properties: ["BulletResist"] }),
		]);
		const after = item(properties, [section("innate", {})]);
		expect(diffItems(before, after)).toEqual([]);
	});

	it("reports a row whose stat is really gone", () => {
		const before = item(
			{ BulletResist: { value: "10", label: "Bullet Resist" } },
			[section("innate", { properties: ["BulletResist"] })],
		);
		const after = item({}, [section("innate", {})]);
		expect(diffItems(before, after)).toEqual([
			expect.objectContaining({ kind: "row-removed", key: "BulletResist" }),
		]);
	});

	it("reports a row whose stat dropped to 0", () => {
		const before = item(
			{ BulletResist: { value: "10", label: "Bullet Resist" } },
			[section("innate", { properties: ["BulletResist"] })],
		);
		const after = item(
			{ BulletResist: { value: "0", label: "Bullet Resist" } },
			[section("innate", {})],
		);
		expect(diffItems(before, after)).toEqual([
			expect.objectContaining({ kind: "row-removed", key: "BulletResist" }),
		]);
	});

	it("ignores a row that appeared for a stat the item already had (Rebuttal)", () => {
		const properties = {
			ParrySuccessHealPercentage: {
				value: "100",
				label: "Damage Parried as Heal",
			},
		};
		const before = item(properties, [
			section("passive", { important_properties: ["ParrySuccessHeal"] }),
		]);
		const after = item(properties, [
			section("passive", {
				important_properties: ["ParrySuccessHealPercentage"],
			}),
		]);
		expect(diffItems(before, after)).toEqual([]);
	});

	it("reports a genuinely new stat (Echo Shard)", () => {
		const before = item({}, [section("active", {})]);
		const after = item(
			{
				ImbuedCooldownMultiplier: {
					value: "100",
					label: "Imbued Ability Cooldown",
				},
			},
			[section("active", { properties: ["ImbuedCooldownMultiplier"] })],
		);
		expect(diffItems(before, after)).toEqual([
			expect.objectContaining({
				kind: "row-added",
				key: "ImbuedCooldownMultiplier",
				value: "100",
			}),
		]);
	});

	it("ignores a rename with the same label and value (Ricochet)", () => {
		const before = item(
			{ RicochetTargetsTooltipOnly: { value: "2", label: "Ricochet Targets" } },
			[section("", { properties: ["RicochetTargetsTooltipOnly"] })],
		);
		const after = item(
			{ RicochetTargets: { value: "2", label: "Ricochet Targets" } },
			[section("", { properties: ["RicochetTargets"] })],
		);
		expect(diffItems(before, after)).toEqual([]);
	});

	it("reports a rename whose value changed as a removal and an addition", () => {
		const before = item({ OldKey: { value: "2", label: "Targets" } }, [
			section("", { properties: ["OldKey"] }),
		]);
		const after = item({ NewKey: { value: "3", label: "Targets" } }, [
			section("", { properties: ["NewKey"] }),
		]);
		const kinds = diffItems(before, after).map((change) => change.kind);
		expect(kinds.sort()).toEqual(["row-added", "row-removed"]);
	});

	it("turns a row that moved section and changed value into one stat change", () => {
		const before = item({ Damage: { value: "50", label: "Damage" } }, [
			section("innate", { properties: ["Damage"] }),
			section("active", {}),
		]);
		const after = item({ Damage: { value: "85", label: "Damage" } }, [
			section("innate", {}),
			section("active", { properties: ["Damage"] }),
		]);
		expect(diffItems(before, after)).toEqual([
			expect.objectContaining({
				kind: "stat",
				key: "Damage",
				old: "50",
				new: "85",
			}),
		]);
	});

	it("treats the string and number forms of a value as equal", () => {
		const before = item({ Damage: { value: "50", label: "Damage" } }, [
			section("active", { properties: ["Damage"] }),
		]);
		const after = item({ Damage: { value: 50, label: "Damage" } }, [
			section("active", { properties: ["Damage"] }),
		]);
		expect(diffItems(before, after)).toEqual([]);
	});
});
