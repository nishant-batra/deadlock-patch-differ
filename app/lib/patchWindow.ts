// app/lib/patchWindow.ts
//
// Valve ships a patch, then usually one or two hotfixes within a few days. A
// build within WINDOW_DAYS of the patch is one of its hotfixes: it goes into
// hotfix.json and leaves the patch's own diff alone. A build after the window
// is the next patch.

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

/** Whether a build released at `buildTime` is a new patch rather than a hotfix. */
export const isNewPatch = (
	current: PatchWindow | undefined,
	buildTime: string,
) =>
	!current ||
	parseBuildTime(buildTime) - parseBuildTime(current.startedAt) >= WINDOW_MS;
