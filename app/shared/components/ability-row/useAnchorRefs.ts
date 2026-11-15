import { useRef } from "react";

/** A stable button ref per ability icon, for its popover to position from. */
export function useAnchorRefs() {
	const anchorRefs = useRef(new Map<number, HTMLButtonElement | null>());

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

	return { setAnchorRef, anchorRefFor };
}
