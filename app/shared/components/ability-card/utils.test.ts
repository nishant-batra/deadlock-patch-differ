import { describe, expect, it } from "vitest";
import type { Change, Item } from "#/types";
import {
	abilityDeltaRow,
	faceDirection,
	faceKeys,
	headerChips,
	scalingOf,
	sectionPropertyKeys,
	splitAbilityChanges,
} from "./utils";

// One section listing two properties, a header with a radius and cooldown,
// and properties the card never shows.
const ABILITY = {
	name: "Sleep Dagger",
	properties: {
		DotDamage: { value: "20", label: "Damage" },
		BonusSpeed: { value: "2", postfix: "m/s" },
		Radius: { value: "10", postfix: "m" },
		AbilityCastRange: { value: "0" },
		AbilityCooldown: { value: "30", postfix: "s" },
		AbilityCooldownBetweenCharge: { value: "-1.0" },
		HiddenThing: { value: "5" },
		SlowPercent: { value: "25", label: "Slow", postfix: "%" },
	},
	tooltip_details: {
		info_sections: [
			{
				loc_string: "Throws a dagger.",
				basic_properties: ["DotDamage"],
				// The Doorman's Bomb ships a block with no `properties` array.
				properties_block: [
					{ properties: [{ important_property: "BonusSpeed" }] },
					{},
				],
			},
		],
	},
} as unknown as Item;

const change = (
	path: string[],
	old?: Change["old"],
	next?: Change["new"],
	kind: Change["kind"] = "modified",
): Change => ({ path, kind, old, new: next });

describe("sectionPropertyKeys", () => {
	it("collects basic and block properties, tolerating a block with none", () => {
		const [section] = ABILITY.tooltip_details?.info_sections ?? [];
		expect(sectionPropertyKeys(section)).toEqual(["DotDamage", "BonusSpeed"]);
	});
});

describe("headerChips", () => {
	it("shows only positive chips that no section already renders", () => {
		expect(headerChips(ABILITY)).toEqual({
			left: ["Radius"],
			right: ["AbilityCooldown"],
		});
	});
});

describe("faceKeys", () => {
	it("is the section keys plus the header chips", () => {
		expect([...faceKeys(ABILITY)].sort()).toEqual([
			"AbilityCooldown",
			"BonusSpeed",
			"DotDamage",
			"Radius",
		]);
	});
});

describe("scalingOf", () => {
	it("reads the named scale type", () => {
		expect(
			scalingOf({
				value: "20",
				scale_function: {
					stat_scale: 0.3,
					specific_stat_scale_type: "EWeaponPower",
				},
			}),
		).toMatchObject({ scale: 0.3, icon: { kind: "weapon" } });
	});

	it("infers spirit from the class name (Scrap Grenade's slow)", () => {
		expect(
			scalingOf({
				value: "20",
				scale_function: {
					stat_scale: 0.1,
					class_name: "scale_function_tech_damage",
				},
			})?.icon?.kind,
		).toBe("spirit");
	});

	it("is undefined without a stat_scale", () => {
		expect(scalingOf({ value: "20" })).toBeUndefined();
	});
});

describe("abilityDeltaRow", () => {
	const props = ABILITY.properties;

	it("labels a value move with the property's own label and units", () => {
		expect(
			abilityDeltaRow(
				change(["properties", "SlowPercent", "value"], "25", "30"),
				props,
			),
		).toEqual({
			id: "properties.SlowPercent.value",
			label: "Slow",
			kind: "stat",
			old: "25",
			new: "30",
			negativeAttribute: false,
			prefix: undefined,
			postfix: "%",
		});
	});

	it("treats a cooldown as negative even without negative_attribute", () => {
		expect(
			abilityDeltaRow(
				change(["properties", "AbilityCooldown", "value"], "30", "25"),
				props,
			).negativeAttribute,
		).toBe(true);
	});

	it("marks a scaling move and drops the property's units", () => {
		const row = abilityDeltaRow(
			change(
				["properties", "SlowPercent", "scale_function", "stat_scale"],
				0.2,
				0.3,
			),
			props,
		);
		expect(row.label).toBe("Slow Scaling");
		expect(row).not.toHaveProperty("postfix");
	});

	it("humanises unlabelled keys and drops non-scalar values", () => {
		const row = abilityDeltaRow(
			change(["properties", "HiddenThing", "value"], ["a"], "5"),
			props,
		);
		expect(row.label).toBe("Hidden Thing");
		expect(row.old).toBeUndefined();
	});
});

describe("splitAbilityChanges", () => {
	const { shown, hidden } = splitAbilityChanges(ABILITY, [
		change(["properties", "DotDamage", "value"], "15", "20"),
		change(
			["properties", "DotDamage", "scale_function", "stat_scale"],
			0.2,
			0.3,
		),
		change(["properties", "HiddenThing", "value"], "4", "5"),
		change(["properties", "Radius", "value"], undefined, "10", "added"),
		change(["tooltip_details", "info_sections", "0", "loc_string"], "a", "b"),
		change(["tooltip_details", "info_sections", "3", "loc_string"], "a", "b"),
		change(["upgrades", "0", "property_upgrades"], [], []),
		change(["description", "t1_desc"], "a", "b"),
		change(["activation"], "press", "instant_cast"),
	]);

	it("marks old -> new moves on face stats in place", () => {
		expect(shown.previous).toEqual(new Map([["DotDamage", "15"]]));
		expect(shown.previousScale).toEqual(new Map([["DotDamage", 0.2]]));
		expect([...shown.text.keys()]).toEqual([0]);
	});

	it("sends hidden stats and new face stats to the panel", () => {
		expect(hidden.rows.map(({ id }) => id)).toEqual([
			"properties.HiddenThing.value",
			"properties.Radius.value",
		]);
	});

	it("keeps text for removed sections and anything unrecognised", () => {
		expect(hidden.removedText.map(({ path }) => path[2])).toEqual(["3"]);
		expect(hidden.other.map(({ path }) => path[0])).toEqual(["activation"]);
	});
});

describe("faceDirection", () => {
	it("judges a face stat the same way the change strip does", () => {
		const { DotDamage, AbilityCooldown } = ABILITY.properties;
		expect(faceDirection("DotDamage", DotDamage, "15")).toBe("better");
		expect(faceDirection("DotDamage", DotDamage, "25")).toBe("worse");
		// Cooldown went 25 -> 30: longer is a nerf.
		expect(faceDirection("AbilityCooldown", AbilityCooldown, "25")).toBe(
			"worse",
		);
	});
});
