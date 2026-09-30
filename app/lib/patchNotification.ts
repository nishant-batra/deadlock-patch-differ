// app/lib/patchNotification.ts
//
// The GitHub issue the ingest workflow opens for every new build - GitHub's own
// notification email is the alert, so no mail credentials are involved. The
// issue lists what this build changed on its own, not the merged window: for
// a hotfix that is the part worth reading.

import type { NoteRef, PatchWindow } from "#/types";
import type { WindowStep } from "./patchWindow";

export const SITE_URL = "https://deadlockpatch.vercel.app";

export type BuildSummary = {
	build: number;
	/** `version_datetime`, zoneless UTC. */
	buildTime: string;
	action: WindowStep["action"];
	window: PatchWindow;
	items: { added: string[]; removed: string[]; changed: string[] };
	heroes: string[];
	note?: NoteRef;
};

const list = (label: string, names: string[]) =>
	names.length > 0 ? [`- **${label}:** ${names.join(", ")}`] : [];

export function patchNotification({
	build,
	buildTime,
	action,
	window: { startBuild },
	items: { added, removed, changed },
	heroes,
	note,
}: BuildSummary): { title: string; body: string } {
	const kind =
		action === "open"
			? "new patch"
			: action === "merge"
				? `hotfix to ${startBuild}`
				: "no player-facing changes";
	const itemLines = [
		...list("New", added),
		...list("Removed", removed),
		...list("Changed", changed),
	];
	const nothing = heroes.length === 0 && itemLines.length === 0;

	const body = [
		`**Build ${build}** · ${buildTime.replace("T", " ").slice(0, 16)} UTC · ${kind}`,
		...(note ? ["", `Patch notes: [${note.title}](${note.link})`] : []),
		...(nothing
			? ["", "Nothing a player would see changed; the site is unchanged."]
			: []),
		...(heroes.length > 0
			? ["", `### Heroes (${heroes.length})`, heroes.join(", ")]
			: []),
		...(itemLines.length > 0 ? ["", "### Items", ...itemLines] : []),
		"",
		`[See all changes](${SITE_URL}/)`,
	].join("\n");

	return { title: `Deadlock build ${build}: ${kind}`, body };
}
