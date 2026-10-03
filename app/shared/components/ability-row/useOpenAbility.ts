import { startTransition, useRef, useState } from "react";

/**
 * Tracks which ability popover (by `class_name`) is open, at most one at a
 * time, plus a stable button ref per ability for `AbilityPopover` to measure
 * its position from.
 *
 * Open/close run inside `startTransition` so the popover's `<ViewTransition>`
 * animates them - React only fires enter/exit for transition updates.
 */
export function useOpenAbility() {
	const [openAbility, setOpenAbility] = useState<string | null>(null);
	const anchorRefs = useRef(new Map<string, HTMLButtonElement | null>());

	const toggleAbility = (className: string) =>
		startTransition(() =>
			setOpenAbility((current) => (current === className ? null : className)),
		);
	const closeAbility = () => startTransition(() => setOpenAbility(null));
	const setAnchorRef =
		(className: string) => (node: HTMLButtonElement | null) => {
			anchorRefs.current.set(className, node);
		};
	const anchorRefFor = (
		className: string,
	): React.RefObject<HTMLButtonElement | null> => ({
		get current() {
			return anchorRefs.current.get(className) ?? null;
		},
	});

	return {
		openAbility,
		toggleAbility,
		closeAbility,
		setAnchorRef,
		anchorRefFor,
	};
}
