import { describe, expect, it } from "vitest";
import { heroSlug } from "./heroSlug";

describe("heroSlug", () => {
	it("kebab-cases names with spaces", () => {
		expect(heroSlug("The Doorman")).toBe("the-doorman");
		expect(heroSlug("Rat King")).toBe("rat-king");
	});

	it("collapses punctuation runs into one hyphen", () => {
		expect(heroSlug("Mo & Krill")).toBe("mo-krill");
	});

	it("trims leading and trailing separators", () => {
		expect(heroSlug("  Haze! ")).toBe("haze");
	});
});
