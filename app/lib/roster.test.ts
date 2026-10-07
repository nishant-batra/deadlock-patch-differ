import { describe, expect, it } from "vitest";
import { isLiveHero, isUpcomingHero } from "./roster";

// Flag combinations as they appear in the build 6722 catalog.
const LIVE = {
	development_state: "release",
	player_selectable: true,
	disabled: false,
	in_development: false,
};
const ANNOUNCED = {
	development_state: "pre_release",
	player_selectable: false,
	disabled: false,
	in_development: false,
};
const HERO_LABS = {
	player_selectable: true,
	disabled: true,
	in_development: true,
};
const SCRAPPED = {
	player_selectable: false,
	disabled: true,
	in_development: true,
};

// Baba, build 6757: released and playable, but Valve left `in_development` set.
const RELEASED_IN_DEVELOPMENT = {
	development_state: "release",
	player_selectable: true,
	disabled: false,
	in_development: true,
};

describe("isLiveHero", () => {
	it("is true for the live roster", () => {
		expect(isLiveHero(LIVE)).toBe(true);
	});

	it("is true for a released hero still flagged in_development (Baba)", () => {
		expect(isLiveHero(RELEASED_IN_DEVELOPMENT)).toBe(true);
		expect(isUpcomingHero(RELEASED_IN_DEVELOPMENT)).toBe(false);
	});

	it("is false for Hero Labs and scrapped heroes", () => {
		expect(isLiveHero(HERO_LABS)).toBe(false);
		expect(isLiveHero(SCRAPPED)).toBe(false);
	});
});

describe("isUpcomingHero", () => {
	it("is true for an announced hero (Violet, Rat King...)", () => {
		expect(isUpcomingHero(ANNOUNCED)).toBe(true);
		expect(isLiveHero(ANNOUNCED)).toBe(false);
	});

	it("is false for the live roster", () => {
		expect(isUpcomingHero(LIVE)).toBe(false);
	});

	it("is false for Hero Labs and scrapped heroes, which are in development but not announced", () => {
		expect(isUpcomingHero(HERO_LABS)).toBe(false);
		expect(isUpcomingHero(SCRAPPED)).toBe(false);
	});

	it("turns false on release even if the API is slow to update development_state", () => {
		const released = { ...ANNOUNCED, player_selectable: true };
		expect(isLiveHero(released)).toBe(true);
		expect(isUpcomingHero(released)).toBe(false);
	});
});
