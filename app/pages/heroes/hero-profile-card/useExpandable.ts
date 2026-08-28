import { useEffect, useState } from "react";

/**
 * A card's "All stats" `<details>` state, seeded from the page-level
 * `expandAll` toggle and re-synced whenever it flips - so the one button
 * drives every card at once, while a card stays individually openable or
 * closeable afterwards (native `<details>` behaviour) until the next flip.
 */
export function useExpandable(expandAll: boolean) {
	const [open, setOpen] = useState(expandAll);
	useEffect(() => setOpen(expandAll), [expandAll]);
	return [open, setOpen] as const;
}
