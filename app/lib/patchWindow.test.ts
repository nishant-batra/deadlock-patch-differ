import { describe, expect, it } from "vitest";
import type { PatchWindow } from "#/types";
import { isNewPatch, parseBuildTime } from "./patchWindow";

const OPENED: PatchWindow = {
	startBuild: 6712,
	startedAt: "2026-09-24T18:00:00",
};

describe("parseBuildTime", () => {
	it("reads a zoneless build time as UTC", () => {
		expect(parseBuildTime("2026-09-29T15:55:11")).toBe(
			Date.UTC(2026, 8, 29, 15, 55, 11),
		);
	});

	it("respects an explicit zone", () => {
		expect(parseBuildTime("2026-09-29T15:55:11Z")).toBe(
			Date.UTC(2026, 8, 29, 15, 55, 11),
		);
		expect(parseBuildTime("2026-09-29T15:55:11+02:00")).toBe(
			Date.UTC(2026, 8, 29, 13, 55, 11),
		);
	});
});

describe("isNewPatch", () => {
	it("makes the first build a patch", () => {
		expect(isNewPatch(undefined, "2026-09-29T15:55:11")).toBe(true);
	});

	it("makes a build within 6 days a hotfix", () => {
		expect(isNewPatch(OPENED, "2026-09-29T18:00:00")).toBe(false);
	});

	it("makes a build 6 days in or later a new patch", () => {
		expect(isNewPatch(OPENED, "2026-09-30T18:00:00")).toBe(true);
		expect(isNewPatch(OPENED, "2026-10-01T18:00:00")).toBe(true);
	});
});
