import { describe, expect, it } from "vitest";
import { type BuildSummary, patchNotification } from "./patchNotification";

const summary = (partial: Partial<BuildSummary> = {}): BuildSummary => ({
	build: 6730,
	buildTime: "2026-10-01T18:00:00",
	action: "open",
	window: {
		startBuild: 6730,
		startedAt: "2026-10-01T18:00:00",
		builds: [6730],
	},
	items: { added: [], removed: [], changed: [] },
	heroes: [],
	...partial,
});

describe("patchNotification", () => {
	it("titles each kind of build", () => {
		expect(patchNotification(summary()).title).toBe(
			"Deadlock build 6730: new patch",
		);
		expect(
			patchNotification(summary({ build: 6731, action: "merge" })).title,
		).toBe("Deadlock build 6731: hotfix to 6730");
		expect(
			patchNotification(summary({ build: 6731, action: "keep" })).title,
		).toBe("Deadlock build 6731: no player-facing changes");
	});

	it("lists heroes, item groups and the patch note", () => {
		const { body } = patchNotification(
			summary({
				heroes: ["Haze", "Wraith"],
				items: { added: ["Shiv"], removed: [], changed: ["Kudzu", "Rebuttal"] },
				note: {
					title: "Gameplay Update",
					pubDate: "2026-10-01",
					link: "https://store.steampowered.com/news/1",
				},
			}),
		);
		expect(body).toBe(
			[
				"**Build 6730** · 2026-10-01 18:00 UTC · new patch",
				"",
				"Patch notes: [Gameplay Update](https://store.steampowered.com/news/1)",
				"",
				"### Heroes (2)",
				"Haze, Wraith",
				"",
				"### Items",
				"- **New:** Shiv",
				"- **Changed:** Kudzu, Rebuttal",
				"",
				"[See all changes](https://deadlockpatch.vercel.app/)",
			].join("\n"),
		);
	});

	it("says so when a build changed nothing visible", () => {
		expect(patchNotification(summary({ action: "keep" })).body).toContain(
			"Nothing a player would see changed",
		);
	});
});
