import { describe, expect, it } from "vitest";
import { rankMatches } from "./utils";

const entries = [
	"Extra Spirit",
	"Spirit Strike",
	"Mystic Burst",
	"Spirit Lifesteal",
	"Fleetfoot",
	"Kinetic Dash",
].map((name) => ({ name }));

const names = (query: string) =>
	rankMatches(entries, query).map(({ name }) => name);

describe("rankMatches", () => {
	it("ranks name prefix, then word prefix, alphabetical within a tier", () => {
		expect(names("spirit")).toEqual([
			"Spirit Lifesteal",
			"Spirit Strike",
			"Extra Spirit",
		]);
	});

	it("matches a word after a hyphen or space", () => {
		expect(names("dash")).toEqual(["Kinetic Dash"]);
	});

	it("falls back to a mid-word substring last", () => {
		expect(names("foot")).toEqual(["Fleetfoot"]);
		expect(names("st")).toEqual([
			"Spirit Strike",
			"Mystic Burst",
			"Spirit Lifesteal",
		]);
	});

	it("is case-insensitive and ignores surrounding whitespace", () => {
		expect(names("  KINETIC ")).toEqual(["Kinetic Dash"]);
	});

	it("returns nothing for a blank query", () => {
		expect(names("   ")).toEqual([]);
	});
});
