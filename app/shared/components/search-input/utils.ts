export type SearchEntry = {
	name: string;
	icon?: string;
	/** Dot beside the result - the item's slot or the hero's accent. */
	color?: string;
};

/** Splits a name into words - "Kinetic-Dash" and "Shadow Weave" both count. */
const WORD_BREAK = /[\s\-'.]+/;

/**
 * Entries whose name contains `query`, best first: the name starts with it,
 * then one of its words does, then it appears anywhere. Alphabetical within a
 * tier. Every match is returned - the dropdown scrolls - since a cap would
 * hide whole tiers ("spirit": a page of Spirit-something items before Extra
 * Spirit). A plain substring scan - a few hundred names is too few for a trie to
 * pay for itself.
 */
export function rankMatches(
	entries: SearchEntry[],
	query: string,
): SearchEntry[] {
	const needle = query.trim().toLowerCase();
	if (!needle) return [];

	const ranked: Array<{ entry: SearchEntry; tier: number }> = [];
	for (const entry of entries) {
		const name = entry.name.toLowerCase();
		const at = name.indexOf(needle);
		if (at === -1) continue;
		const tier =
			at === 0
				? 0
				: name.split(WORD_BREAK).some((word) => word.startsWith(needle))
					? 1
					: 2;
		ranked.push({ entry, tier });
	}

	return ranked
		.sort((a, b) => a.tier - b.tier || a.entry.name.localeCompare(b.entry.name))
		.map(({ entry }) => entry);
}

/** Whether a keypress is going into a text field, so `/` should type, not jump. */
export function isTyping(target: EventTarget | null) {
	return (
		target instanceof HTMLElement &&
		(target.isContentEditable ||
			["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
	);
}
