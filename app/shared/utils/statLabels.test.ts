import { describe, expect, it } from "vitest";
import {
	humaniseStatKey,
	isNegativeHeroStat,
	labelForStatKey,
} from "./statLabels";

describe("labelForStatKey", () => {
	it("uses the hand-written label for known starting stats and level-ups", () => {
		expect(labelForStatKey("tech_armor_damage_reduction")).toBe(
			"Spirit Resist",
		);
		expect(labelForStatKey("MODIFIER_VALUE_BASE_HEALTH_FROM_LEVEL")).toBe(
			"Health / Level",
		);
	});

	it("humanises anything unlisted", () => {
		expect(labelForStatKey("some_new_stat")).toBe("Some New Stat");
	});
});

describe("humaniseStatKey", () => {
	it("splits PascalCase property keys", () => {
		expect(humaniseStatKey("HealAmpReceivePenaltyPercent")).toBe(
			"Heal Amp Receive Penalty Percent",
		);
	});

	it("drops the MODIFIER_VALUE_ prefix and title-cases SCREAMING_SNAKE", () => {
		expect(humaniseStatKey("MODIFIER_VALUE_SPRINT_SPEED")).toBe("Sprint Speed");
		expect(humaniseStatKey("air_dash_duration")).toBe("Air Dash Duration");
	});

	it("leaves short acronyms alone", () => {
		expect(humaniseStatKey("BonusDPS")).toBe("Bonus DPS");
	});
});

describe("isNegativeHeroStat", () => {
	it("flags stats where higher is worse", () => {
		expect(isNegativeHeroStat("reload_duration")).toBe(true);
		expect(isNegativeHeroStat("crit_damage_received_scale")).toBe(true);
	});

	it("treats everything else as higher-is-better", () => {
		expect(isNegativeHeroStat("max_health")).toBe(false);
	});
});
