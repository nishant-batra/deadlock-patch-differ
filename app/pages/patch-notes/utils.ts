import type { PatchNotes } from "#/types";

/**
 * The newest of the notes the page shows - the balance note behind the
 * item/hero diff, or a newer general note. This is the date the page is
 * headlined with, so a general-only update still reads as fresh.
 */
export const latestNoteDate = ({ balance, general }: PatchNotes) =>
	[balance?.pubDate, general?.pubDate]
		.filter((date): date is string => Boolean(date))
		.sort((a, b) => Date.parse(b) - Date.parse(a))[0];
