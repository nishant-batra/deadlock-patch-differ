import { describe, expect, it } from "vitest";
import type { Item, TooltipSection } from "#/types";
import { toCatalogItem } from "./utils";

const KNOCKDOWN = {
	name: "Knockdown",
	cost: 3200,
	shop_image: "knockdown.png",
	tooltip_sections: [
		{
			section_type: "active",
			section_attributes: [
				{ important_properties: ["StatusEffectStun"], properties: ["Radius"] },
			],
		},
	] as TooltipSection[],
	properties: {
		StatusEffectStun: { value: "1", label: "Stun" },
		StunDuration: { value: "0.75", postfix: "s" },
		Radius: {
			value: "10",
			label: "Radius",
			postfix: "m",
			provided_property_type: "MODIFIER_VALUE_RADIUS",
			scale_function: { stat_scale: 0.1 },
		},
		AbilityCooldown: { value: "40", postfix: "s" },
		ScalingInternal: { value: "7" },
		ChangedHidden: { value: "5" },
	},
} as unknown as Item;

describe("toCatalogItem", () => {
	const trimmed = toCatalogItem(KNOCKDOWN, [
		{
			kind: "stat",
			section: "active",
			key: "ChangedHidden",
			label: "Changed",
			old: 4,
			new: 5,
		},
		{ kind: "cost", old: 3000, new: 3200 },
	]);

	it("keeps listed keys, the cooldown, badge durations and changed keys", () => {
		expect(Object.keys(trimmed.properties).sort()).toEqual([
			"AbilityCooldown",
			"ChangedHidden",
			"Radius",
			"StatusEffectStun",
			"StunDuration",
		]);
	});

	it("strips each property to the fields the card renders", () => {
		expect(trimmed.properties.Radius).toEqual({
			value: "10",
			label: "Radius",
			postfix: "m",
		});
	});

	it("drops the shop image and keeps everything else", () => {
		expect(trimmed).not.toHaveProperty("shop_image");
		expect(trimmed.cost).toBe(3200);
		expect(trimmed.tooltip_sections).toBe(KNOCKDOWN.tooltip_sections);
	});

	it("works without a change list", () => {
		expect(toCatalogItem(KNOCKDOWN).properties).not.toHaveProperty(
			"ChangedHidden",
		);
	});
});
