// app/utils/diffEngine.ts

export type DiffNode = {
	added: Record<string, any>;
	removed: Record<string, any>;
	modified: Record<string, any>;
	unmodified: Record<string, any>; // <-- New field to track unchanged data
};

// Helper to check if a value is a standard JSON object (and not an array or null)
const isObject = (val: any) =>
	val !== null && typeof val === "object" && !Array.isArray(val);

/**
 * Recursively compares two JSON objects and isolates the exact changes.
 */
export function calculateDeepDiff(
	oldJson: Record<string, any>,
	newJson: Record<string, any>,
): DiffNode {
	const diff: DiffNode = {
		added: {},
		removed: {},
		modified: {},
		unmodified: {},
	};

	// 1. Find Added, Modified, and Unmodified fields
	for (const key in newJson) {
		if (!(key in oldJson)) {
			// The key doesn't exist in the old JSON, so it's brand new
			diff.added[key] = newJson[key];
		} else {
			// The key exists in both. We need to check if the values changed.
			const oldVal = oldJson[key];
			const newVal = newJson[key];

			// If both values are objects, we recursively dive deeper into them
			if (isObject(oldVal) && isObject(newVal)) {
				const nestedDiff = calculateDeepDiff(oldVal, newVal);

				// If anything changed inside this nested object, attach the whole nested diff
				if (
					Object.keys(nestedDiff.added).length > 0 ||
					Object.keys(nestedDiff.removed).length > 0 ||
					Object.keys(nestedDiff.modified).length > 0
				) {
					diff.modified[key] = nestedDiff;
				} else {
					// If the nested object is perfectly identical, it goes here
					diff.unmodified[key] = newVal;
				}
			}
			// If they are primitive values (or arrays) and they don't match exactly
			else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
				diff.modified[key] = { old: oldVal, new: newVal };
			}
			// If primitive values match exactly
			else {
				diff.unmodified[key] = newVal;
			}
		}
	}

	// 2. Find Removed fields
	for (const key in oldJson) {
		if (!(key in newJson)) {
			diff.removed[key] = oldJson[key];
		}
	}

	return diff;
}

/**
 * Wrapper specifically for Deadlock API data to prevent Array Index shifting
 */
export function generateDeadlockPatchDiff(
	oldPatchArray: any[],
	newPatchArray: any[],
) {
	// Using Object.fromEntries for O(n) performance and clean JSON serialization
	const oldMapped = Object.fromEntries(
		oldPatchArray.map((item) => [item.name ?? item.class_name, item]),
	);

	const newMapped = Object.fromEntries(
		newPatchArray.map((item) => [item.name ?? item.class_name, item]),
	);

	return calculateDeepDiff(oldMapped, newMapped);
}
// ---------------------------------------------------------------------------
// Pruning + flattening
// ---------------------------------------------------------------------------

export type DiffLeaf = { old: ChangeValue; new: ChangeValue };

export type PrunedNode = {
	added: Record<string, ChangeValue>;
	removed: Record<string, ChangeValue>;
	modified: Record<string, PrunedNode | DiffLeaf>;
};

export const EMPTY_DIFF: PrunedNode = { added: {}, removed: {}, modified: {} };

/** A `DiffNode`/`PrunedNode` is recognised structurally, not by class. */
export const isDiffNode = (val: unknown): val is DiffNode => {
	if (!isObject(val)) return false;
	const node = val as Record<string, unknown>;
	return "added" in node && "removed" in node && "modified" in node;
};

export const hasAnyChange = (node: PrunedNode): boolean =>
	Object.keys(node.added).length > 0 ||
	Object.keys(node.removed).length > 0 ||
	Object.keys(node.modified).length > 0;

/**
 * Drops `unmodified` everywhere and removes nested nodes that ended up empty.
 * Measured on a real diff: 7.13 MB -> ~130 KB with every change preserved.
 */
export function pruneUnmodified(node: DiffNode): PrunedNode {
	const out: PrunedNode = {
		added: node.added,
		removed: node.removed,
		modified: {},
	};
	for (const [key, value] of Object.entries(node.modified)) {
		if (isDiffNode(value)) {
			const child = pruneUnmodified(value);
			if (hasAnyChange(child)) out.modified[key] = child;
		} else {
			out.modified[key] = value as DiffLeaf;
		}
	}
	return out;
}

/**
 * Anything that can come out of the API payload. Spelled out rather than left
 * as `unknown` because `Change` crosses a `createServerFn` boundary, and the
 * serialization types reject `unknown`.
 */
export type ChangeValue =
	| string
	| number
	| boolean
	| null
	| ChangeValue[]
	| { [key: string]: ChangeValue };

export type Change = {
	path: string[];
	kind: "added" | "removed" | "modified";
	old?: ChangeValue;
	new?: ChangeValue;
};

/**
 * Flattens the nested-vs-leaf split once, so no component has to discriminate.
 */
export function summarize(
	node: PrunedNode | undefined | null,
	path: string[] = [],
): Change[] {
	if (!node) return [];
	const changes: Change[] = [];
	for (const [key, value] of Object.entries(node.added ?? {})) {
		changes.push({ path: [...path, key], kind: "added", new: value });
	}
	for (const [key, value] of Object.entries(node.removed ?? {})) {
		changes.push({ path: [...path, key], kind: "removed", old: value });
	}
	for (const [key, value] of Object.entries(node.modified ?? {})) {
		if (isDiffNode(value)) {
			changes.push(...summarize(value as PrunedNode, [...path, key]));
		} else {
			const leaf = value as DiffLeaf;
			changes.push({
				path: [...path, key],
				kind: "modified",
				old: leaf.old,
				new: leaf.new,
			});
		}
	}
	return changes;
}

/** `['properties','BulletDamage','value']` — a displayable stat move. */
export const isStatChange = (change: Change) =>
	change.path[0] === "properties" && change.path.at(-1) === "value";

export const statKeyOf = (change: Change) => change.path[1];
