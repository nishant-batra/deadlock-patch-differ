import type { PopoverNav } from "#/shared/components/ability-popover/types";

/** Which of a row's ability popovers is open, and how to change that. */
export type OpenState = {
	openAbility: number | null;
	/** "closing" while the popover plays its exit animation, until `onClosed`. */
	status: "open" | "closing" | "closed";
	/** The exit animation finished: unmount the popover. */
	onClosed: () => void;
	/** Opened by hovering its icon: leaving the icon closes it again. */
	preview: boolean;
	/** A tap or keyboard press: opens it pinned, or closes it if already pinned. */
	toggle: (index: number) => void;
	/** Opens a hover preview, unless something is already pinned open. */
	showPreview: (index: number) => void;
	/** Closes the row's popover only if it is still a hover preview. */
	closePreview: () => void;
	close: () => void;
	/** Moving between changed abilities; only set while a changed one is open. */
	nav?: PopoverNav;
	/**
	 * Set when the owner renders the popover itself (the patch-notes page, so
	 * one popover stays mounted while prev/next steps across cards): the row
	 * registers its icons here and renders no popover of its own.
	 */
	setAnchorRef?: (index: number) => (node: HTMLButtonElement | null) => void;
	/** The owner's hover timer, shared with its popover so moving onto it keeps a preview open. */
	hoverTimer?: React.RefObject<ReturnType<typeof setTimeout> | undefined>;
};
