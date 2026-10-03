import { describe, expect, it } from "vitest";
import { scalingIcon } from "./scaling";

describe("scalingIcon", () => {
	it("maps each scale type to its family", () => {
		expect(scalingIcon("ETechPower")?.kind).toBe("spirit");
		expect(scalingIcon("ETechRange")?.kind).toBe("spirit");
		expect(scalingIcon("EBaseWeaponDamageIncrease")?.kind).toBe("weapon");
		expect(scalingIcon("EHeavyMeleeDamage")?.kind).toBe("melee");
	});

	it("returns undefined for unknown or missing types", () => {
		expect(scalingIcon("ESomethingNew")).toBeUndefined();
		expect(scalingIcon(undefined)).toBeUndefined();
	});
});
