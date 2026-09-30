// app/lib/patchWindow.ts
//
// Valve ships a patch, then usually one or two hotfixes within a few days.
// Diffing each build only against the one before it made a hotfix the sole
// change on the page - build 6722 replaced all of 6712's changes with its own
// handful. So builds are grouped into a window: the build that opens it, plus
// every build within WINDOW_DAYS of it. A build inside the window merges its
// changes into the page (see mergeChanges.ts); one after it starts afresh.

import type { PatchWindow } from "#/types";

export const WINDOW_DAYS = 6;
const WINDOW_MS = WINDOW_DAYS * 24 * 60 * 60 * 1000;

/**
 * `version_datetime` carries no zone ("2026-09-29T15:55:11"), and `Date.parse`
 * reads a zoneless date-time as local time. Pinning it to UTC keeps the window
 * length independent of the machine ingest runs on.
 */
export const parseBuildTime = (datetime: string) =>
	Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(datetime) ? datetime : `${datetime}Z`);

export type WindowStep =
	/** Nothing a player would see moved: keep the page and the window as is. */
	| { action: "keep"; window: PatchWindow }
	/** A hotfix inside the window: merge its changes into the page. */
	| { action: "merge"; window: PatchWindow }
	/** A new patch: its changes replace the page. */
	| { action: "open"; window: PatchWindow };

/**
 * Where a newly ingested build lands.
 *
 * - No visible changes -> keep. A hotfix with nothing to show must not blank
 *   the page, and must not open a window either.
 * - A build already in the window -> merge. The API re-publishing the same
 *   build (schema drift) is not a new patch, however late it arrives.
 * - Less than WINDOW_DAYS after the window opened -> merge.
 * - Otherwise, or with no window yet -> open.
 */
export function placeBuild(
	current: PatchWindow | undefined,
	build: number,
	buildTime: string,
	hasVisibleChanges: boolean,
): WindowStep {
	if (current && !hasVisibleChanges) return { action: "keep", window: current };

	if (current) {
		const { builds, startedAt } = current;
		const elapsed = parseBuildTime(buildTime) - parseBuildTime(startedAt);
		if (builds.includes(build) || elapsed < WINDOW_MS) {
			return {
				action: "merge",
				window: builds.includes(build)
					? current
					: { ...current, builds: [...builds, build] },
			};
		}
	}

	return {
		action: "open",
		window: { startBuild: build, startedAt: buildTime, builds: [build] },
	};
}
