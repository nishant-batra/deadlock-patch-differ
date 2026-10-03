import clsx from "clsx";
import { useId } from "react";
import CutFrame from "#/shared/components/cut-frame";
import { NEUTRAL } from "#/shared/components/item-card/constants";
import { useSearchCombobox } from "./useSearchCombobox";
import type { SearchEntry } from "./utils";

/**
 * Search box with a ranked dropdown of matching names - picking one hands the
 * name to `onSelect` (usually `useScrollTargets().scrollTo`). `/` and Ctrl+F
 * jump here; see `useSearchCombobox`.
 */
export default function SearchInput({
	entries,
	onSelect,
	placeholder,
	className,
}: {
	entries: SearchEntry[];
	onSelect: (name: string) => void;
	placeholder: string;
	/** Layout only (width, margin). */
	className?: string;
}) {
	const listId = useId();
	const {
		inputRef,
		query,
		matches,
		activeIndex,
		setActiveIndex,
		open,
		setOpen,
		onChange,
		onKeyDown,
		pick,
	} = useSearchCombobox(entries, onSelect);
	const optionId = (index: number) => `${listId}-${index}`;

	return (
		<div className={clsx("relative", className)}>
			<CutFrame color={NEUTRAL.primary} className="flex">
				<input
					ref={inputRef}
					type="search"
					role="combobox"
					aria-expanded={open}
					aria-controls={listId}
					aria-autocomplete="list"
					aria-activedescendant={
						open && matches.length ? optionId(activeIndex) : undefined
					}
					aria-label={placeholder}
					placeholder={`${placeholder}  ( / )`}
					value={query}
					onChange={(event) => onChange(event.target.value)}
					onKeyDown={onKeyDown}
					onFocus={() => setOpen(true)}
					onBlur={() => setOpen(false)}
					className="cut-corner w-full bg-[#1b1b24] px-3 py-1.5 text-sm outline-none placeholder:text-gray-500"
				/>
			</CutFrame>
			{open && (
				<div
					id={listId}
					role="listbox"
					className="absolute top-full right-0 left-0 z-20 mt-1 max-h-96 overflow-y-auto border border-[#3A3A47] bg-[#1b1b24] py-1 shadow-lg"
				>
					{matches.length === 0 && (
						<p className="px-3 py-2 text-gray-500 text-sm">No matches</p>
					)}
					{matches.map(({ name, icon, color }, index) => (
						// biome-ignore lint/a11y/useKeyWithClickEvents: keys are handled on the input - options are reached through `aria-activedescendant`, never focused
						<div
							key={name}
							id={optionId(index)}
							role="option"
							tabIndex={-1}
							aria-selected={index === activeIndex}
							// Keep focus in the box, so its blur doesn't close the list
							// before the click lands.
							onMouseDown={(event) => event.preventDefault()}
							onClick={() => pick(name)}
							onMouseMove={() => setActiveIndex(index)}
							className={clsx(
								"flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm",
								index === activeIndex && "bg-[#2a2a36]",
							)}
						>
							{icon && (
								<img
									src={icon}
									alt=""
									width={24}
									height={24}
									className="size-6"
								/>
							)}
							<span className="flex-1 truncate">{name}</span>
							{color && (
								<span
									className="size-2 shrink-0 rounded-full"
									style={{ background: color }}
								/>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
