import type { KeyboardEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { isTyping, rankMatches, type SearchEntry } from "./utils";

/**
 * The search box's query, dropdown and keyboard handling.
 *
 * `inputRef` is a callback ref that also owns the page shortcuts: `/` and
 * Ctrl/Cmd+F focus the box. Once it's focused, Ctrl+F is left alone, so a
 * second press opens the browser's own find.
 */
export function useSearchCombobox(
	entries: SearchEntry[],
	onSelect: (name: string) => void,
) {
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(0);
	const matches = useMemo(() => rankMatches(entries, query), [entries, query]);

	const inputRef = useCallback((input: HTMLInputElement | null) => {
		if (!input) return;
		const onKeyDown = (event: globalThis.KeyboardEvent) => {
			const find =
				(event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f";
			const slash = event.key === "/" && !isTyping(event.target);
			if (!(find || slash) || document.activeElement === input) return;
			event.preventDefault();
			input.focus();
			input.select();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	const pick = (name: string) => {
		setQuery("");
		setOpen(false);
		// Blurred so `/` and Ctrl+F bring the box back rather than typing or
		// opening native find. Options keep focus on the box when clicked, so it's
		// still the active element here.
		if (document.activeElement instanceof HTMLElement)
			document.activeElement.blur();
		onSelect(name);
	};

	const onChange = (value: string) => {
		setQuery(value);
		setActiveIndex(0);
		setOpen(true);
	};

	const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		const input = event.currentTarget;
		switch (event.key) {
			case "ArrowDown":
			case "ArrowUp": {
				if (!matches.length) return;
				event.preventDefault();
				setOpen(true);
				const step = event.key === "ArrowDown" ? 1 : -1;
				const next = (activeIndex + step + matches.length) % matches.length;
				setActiveIndex(next);
				// The list scrolls, and focus stays in the box, so nothing else
				// brings the highlighted option into view.
				const list = document.getElementById(
					input.getAttribute("aria-controls") ?? "",
				);
				list?.children[next]?.scrollIntoView({ block: "nearest" });
				return;
			}
			case "Enter": {
				const match = matches[activeIndex];
				if (!open || !match) return;
				event.preventDefault();
				pick(match.name);
				return;
			}
			case "Escape":
				// First Esc closes the list, a second clears and leaves the box.
				if (open && query) setOpen(false);
				else {
					setQuery("");
					input.blur();
				}
				return;
		}
	};

	return {
		inputRef,
		query,
		matches,
		activeIndex,
		setActiveIndex,
		open: open && query.trim() !== "",
		setOpen,
		onChange,
		onKeyDown,
		pick,
	};
}
