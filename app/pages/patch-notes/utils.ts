import type { ItemChanges, NoteRef, PatchNotes } from "#/types";

export const itemCount = ({ added, removed, changed }: ItemChanges) =>
	added.length + removed.length + changed.length;

/**
 * Jump targets inside a section clear the navbar and the section's sticky bar
 * (2.5rem on one row).
 */
export const BELOW_BAR =
	"scroll-mt-[calc(var(--nav-height)+var(--sticky-bar-height,2.5rem))]";

/**
 * The newest of the notes the page shows - the balance note behind the
 * item/hero diff, the newest hotfix's, or a newer general note. This is the
 * date the page is headlined with, so a general-only update still reads as
 * fresh.
 */
export const latestNoteDate = (
	{ balance, general }: PatchNotes,
	hotfixNote?: NoteRef,
) =>
	[balance?.pubDate, general?.pubDate, hotfixNote?.pubDate]
		.filter((date): date is string => Boolean(date))
		.sort((a, b) => Date.parse(b) - Date.parse(a))[0];
