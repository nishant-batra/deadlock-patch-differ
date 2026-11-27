import { useState } from "react";
import type { OpenState } from "./types";

type Open = {
	index: number;
	preview: boolean;
	status: "open" | "closing";
} | null;

const closing = (current: Open): Open =>
	current && { ...current, status: "closing" };

/**
 * Which ability popover in one row is open - at most one at a time - for rows
 * nothing outside owns (the all-heroes page). Closing goes through "closing"
 * so the popover can play its exit animation before it unmounts.
 */
export function useOpenAbility(): OpenState {
	const [open, setOpen] = useState<Open>(null);

	return {
		openAbility: open?.index ?? null,
		preview: open?.preview ?? false,
		status: open?.status ?? "closed",
		toggle: (index) =>
			setOpen((current) =>
				current?.index === index &&
				!current.preview &&
				current.status === "open"
					? closing(current)
					: { index, preview: false, status: "open" },
			),
		showPreview: (index) =>
			setOpen((current) =>
				current && !current.preview && current.status === "open"
					? current
					: { index, preview: true, status: "open" },
			),
		closePreview: () =>
			setOpen((current) => (current?.preview ? closing(current) : current)),
		close: () => setOpen(closing),
		onClosed: () =>
			setOpen((current) => (current?.status === "closing" ? null : current)),
	};
}
