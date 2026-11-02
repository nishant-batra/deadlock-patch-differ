import { startTransition, useRef, useState } from "react";

/**
 * Tracks which ability popover is open - by its index in the hero's ability
 * row, at most one at a time - plus a stable button ref per ability for
 * `AbilityPopover` to measure its position from.
 *
 * Open/close run inside `startTransition` so the popover's `<ViewTransition>`
 * animates them - React only fires enter/exit for transition updates.
 */
export function useOpenAbility() {
	const [openAbility, setOpenAbility] = useState<number | null>(null);
	const anchorRefs = useRef(new Map<number, HTMLButtonElement | null>());

	const toggleAbility = (index: number) =>
		startTransition(() =>
			setOpenAbility((current) => (current === index ? null : index)),
		);
	const closeAbility = () => startTransition(() => setOpenAbility(null));
	const setAnchorRef = (index: number) => (node: HTMLButtonElement | null) => {
		anchorRefs.current.set(index, node);
	};
	const anchorRefFor = (
		index: number,
	): React.RefObject<HTMLButtonElement | null> => ({
		get current() {
			return anchorRefs.current.get(index) ?? null;
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
