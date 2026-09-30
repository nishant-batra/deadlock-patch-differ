import { describe, expect, it } from "vitest";
import type { Item } from "#/types";
import { diffAbilityTiersByClass, hasTierChanges } from "./abilityUpgrades";

const ability = (
	class_name: string,
	name: string,
	tierBonuses: Array<Record<string, string>>,
): Item =>
	({
		class_name,
		name,
		properties: {},
		upgrades: tierBonuses.map((bonuses) => ({
			property_upgrades: Object.entries(bonuses).map(([key, bonus]) => ({
				name: key,
				bonus,
			})),
		})),
	}) as unknown as Item;

const FROZEN_SHELTER = ability("ability_ice_dome", "Frozen Shelter", [
	{ AbilityCooldown: "-20" },
	{ AbilityDuration: "1.5" },
	{ BonusHealthRegen: "65" },
]);
// A helper item sharing the ability's display name, with no upgrades.
const TRIGGER = ability("ability_ice_dome_trigger", "Frozen Shelter", []);

describe("diffAbilityTiersByClass", () => {
	it("reports nothing for an unchanged ability even when a same-named helper exists", () => {
		const catalog = [FROZEN_SHELTER, TRIGGER];
		const tiers = diffAbilityTiersByClass(
			catalog,
			catalog,
			new Set(["ability_ice_dome"]),
		);
		expect(Object.keys(tiers)).toEqual(["Frozen Shelter"]);
		expect(hasTierChanges(tiers["Frozen Shelter"])).toBe(false);
	});

	it("reports a real tier change", () => {
		const buffed = ability("ability_ice_dome", "Frozen Shelter", [
			{ AbilityCooldown: "-25" },
			{ AbilityDuration: "1.5" },
			{ BonusHealthRegen: "65" },
		]);
		const tiers = diffAbilityTiersByClass(
			[FROZEN_SHELTER, TRIGGER],
			[buffed, TRIGGER],
			new Set(["ability_ice_dome"]),
		);
		const rows = tiers["Frozen Shelter"].flatMap((tier) => tier.rows);
		expect(rows.filter((row) => row.kind !== "equal")).toEqual([
			expect.objectContaining({ kind: "changed", old: "-20", new: "-25" }),
		]);
	});

	it("diffs a brand-new ability against itself", () => {
		const tiers = diffAbilityTiersByClass(
			[],
			[FROZEN_SHELTER],
			new Set(["ability_ice_dome"]),
		);
		expect(hasTierChanges(tiers["Frozen Shelter"])).toBe(false);
	});
});
