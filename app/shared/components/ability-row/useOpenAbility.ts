import { startTransition, useState } from "react";
import type { OpenState } from "./types";

type Open = { index: number; preview: boolean } | null;

/**
 * Which ability popover in one row is open - at most one at a time - for rows
 * nothing outside owns (the all-heroes page).
 *
 * Updates run inside `startTransition` so the popover's `<ViewTransition>`
 * animates them - React only fires enter/exit for transition updates.
 */
export function useOpenAbility(): OpenState {
	const [open, setOpen] = useState<Open>(null);
	const update = (next: (current: Open) => Open) =>
		startTransition(() => setOpen(next));

	return {
		openAbility: open?.index ?? null,
		preview: open?.preview ?? false,
		toggle: (index) =>
			update((current) =>
				current?.index === index && !current.preview
					? null
					: { index, preview: false },
			),
		showPreview: (index) =>
			update((current) =>
				current && !current.preview ? current : { index, preview: true },
			),
		closePreview: () =>
			update((current) => (current?.preview ? null : current)),
		close: () => update(() => null),
	};
}
