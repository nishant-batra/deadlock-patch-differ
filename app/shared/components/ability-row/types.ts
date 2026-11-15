import type { PopoverNav } from "#/shared/components/ability-popover/types";

/** Which of a row's ability popovers is open, and how to change that. */
export type OpenState = {
	openAbility: number | null;
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
};
