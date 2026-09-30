import { describe, expect, it } from "vitest";
import type { PatchWindow } from "#/types";
import { parseBuildTime, placeBuild } from "./patchWindow";

const OPENED: PatchWindow = {
	startBuild: 6712,
	startedAt: "2026-09-24T18:00:00",
	builds: [6712],
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

describe("placeBuild", () => {
	it("opens the first window", () => {
		expect(placeBuild(undefined, 6722, "2026-09-29T15:55:11", true)).toEqual({
			action: "open",
			window: {
				startBuild: 6722,
				startedAt: "2026-09-29T15:55:11",
				builds: [6722],
			},
		});
	});

	it("merges a hotfix 5 days in and records its build", () => {
		expect(placeBuild(OPENED, 6722, "2026-09-29T18:00:00", true)).toEqual({
			action: "merge",
			window: { ...OPENED, builds: [6712, 6722] },
		});
	});

	it("opens a new window exactly 6 days in", () => {
		expect(placeBuild(OPENED, 6730, "2026-09-30T18:00:00", true).action).toBe(
			"open",
		);
	});

	it("opens a new window 7 days in", () => {
		expect(placeBuild(OPENED, 6730, "2026-10-01T18:00:00", true)).toEqual({
			action: "open",
			window: {
				startBuild: 6730,
				startedAt: "2026-10-01T18:00:00",
				builds: [6730],
			},
		});
	});

	it("keeps page and window when a build has nothing visible, even late", () => {
		expect(placeBuild(OPENED, 6722, "2026-09-29T18:00:00", false)).toEqual({
			action: "keep",
			window: OPENED,
		});
		expect(placeBuild(OPENED, 6730, "2026-10-09T18:00:00", false)).toEqual({
			action: "keep",
			window: OPENED,
		});
	});

	it("merges a build already in the window however late it is re-published", () => {
		expect(placeBuild(OPENED, 6712, "2026-10-09T18:00:00", true)).toEqual({
			action: "merge",
			window: OPENED,
		});
	});
});
