/** Where a popover prev/next button goes. */
export type StepTarget = {
	/** The ability it opens. */
	name: string;
	/** Set when that ability is on another hero's card. */
	heroName?: string;
	/** True when stepping past the end of the list back round to the other end. */
	wraps?: boolean;
	go: () => void;
};

/** Everything the popover shows for moving between changed abilities. */
export type PopoverNav = {
	/** The open ability's hero within the whole list, when it cycles across heroes. */
	hero?: { name: string; position: number; total: number };
	/** This hero's changed abilities, in row order - the stepper. */
	changes: { name: string; current: boolean; go: () => void }[];
	prev?: StepTarget;
	next?: StepTarget;
};
