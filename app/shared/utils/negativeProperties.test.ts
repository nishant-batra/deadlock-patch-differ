import { describe, expect, it } from "vitest";
import { isNegativeProperty } from "./negativeProperties";

// Real properties from the 30 October 2026 patch, trimmed to what the rule reads.
const scaled = (specific_stat_scale_type: string) => ({
	scale_function: {
		class_name: "scale_function_single_stat",
		specific_stat_scale_type,
	},
});

describe("isNegativeProperty", () => {
	it("trusts what the stat scales with over its name or icon", () => {
		// Project Mind: cooldown reduction shrinks it, so lower is better.
		expect(isNegativeProperty("AbilityCooldown", scaled("ETechCooldown"))).toBe(
			true,
		);
		// Shiv's Killing Blow: wears the cooldown icon but duration items grow it.
		expect(isNegativeProperty("RecastWindow", scaled("ETechDuration"))).toBe(
			false,
		);
		// Apollo's Riposte and Yamato's Flying Slash: bigger is better.
		expect(isNegativeProperty("StunDuration", scaled("ETechDuration"))).toBe(
			false,
		);
		expect(isNegativeProperty("AbilityCastRange", scaled("ETechRange"))).toBe(
			false,
		);
	});

	it("reads unscaled waits and delays as worse when longer", () => {
		for (const key of [
			"AbilityCastDelay", // Project Mind
			"TeleportCompletedTime", // Mirage's Traveler wait time
			"InterruptCooldown", // Mirage's Traveler
			"ZombieWallDeployTime", // Graves' Grasping Hands
			"BuildupTime", // Nurse Harrow's Lurking Terrors
			"BrewTime", // Baba's Brew
		]) {
			expect(isNegativeProperty(key), key).toBe(true);
		}
	});

	it("leaves the stats that cut a wait, and plain durations, as better when bigger", () => {
		for (const key of [
			"CooldownReduction",
			"CooldownRefundPercent",
			"ResetCooldownOnFriendlyHook",
			"CooldownSpeedPerBlastedPct",
			"CooldownRefreshChancePercent",
			"DebuffDuration", // Baba's Threadsap
			"LeechGroundLifetime", // Nurse Harrow's Leech Therapy
		]) {
			expect(isNegativeProperty(key), key).toBe(false);
		}
	});
});
