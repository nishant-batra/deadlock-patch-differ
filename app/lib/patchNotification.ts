// app/lib/patchNotification.ts
//
// The GitHub issue the ingest workflow opens for every new build - GitHub's own
// notification email is the alert, so no mail credentials are involved. The
// issue lists what this build changed on its own, not the merged hotfixes.

import type { NoteRef } from "#/types";

export const SITE_URL = "https://deadlockpatch.vercel.app";

export type BuildSummary = {
	build: number;
	/** `version_datetime`, zoneless UTC. */
	buildTime: string;
	/** The patch's build, when this build is one of its hotfixes. */
	hotfixTo?: number;
	items: { added: string[]; removed: string[]; changed: string[] };
	heroes: string[];
	note?: NoteRef;
};

const list = (label: string, names: string[]) =>
	names.length > 0 ? [`- **${label}:** ${names.join(", ")}`] : [];

export function patchNotification({
	build,
	buildTime,
	hotfixTo,
	items: { added, removed, changed },
	heroes,
	note,
}: BuildSummary): { title: string; body: string } {
	const itemLines = [
		...list("New", added),
		...list("Removed", removed),
		...list("Changed", changed),
	];
	const nothing = heroes.length === 0 && itemLines.length === 0;
	const kind = nothing
		? "no player-facing changes"
		: hotfixTo
			? `hotfix to ${hotfixTo}`
			: "new patch";

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
