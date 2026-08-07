import type { Change, DisplayChange, Item } from "#/types";
import { statKeyOf } from "#/utils/diffEngine";
import { humaniseStatKey } from "./constants";

/** A single row in the change strip, normalised from a `DisplayChange`. */
export type DeltaRow = {
	id: string;
	label: string;
	kind: "stat" | "added" | "removed";
	old?: string | number;
	new?: string | number;
	negativeAttribute?: boolean;
};

/**
 * Normalises the row-shaped changes and resolves their labels. `text` and
 * `components` changes are not rows and are rendered separately.
 *
 * Distinct properties can share a `label` - Toxic Bullets moves both
 * `HealAmpReceivePenaltyPercent` and `HealAmpRegenPenaltyPercent`, and both are
 * labelled "Healing Reduction". Rendered as-is that reads like a duplicated
 * row, so when a label would appear twice in the same strip the property key is
 * appended to tell them apart.
 */
export function resolveDeltaRows(
	changes: DisplayChange[],
	allProperties: Item["properties"],
): DeltaRow[] {
	const rows: Array<DeltaRow & { key?: string }> = [];

	// Ids are positional. A few items carry two sections of the same type, so
	// `section.key` alone can repeat within one card and collide as a React key.
	for (const [index, change] of changes.entries()) {
		switch (change.kind) {
			case "cost":
				rows.push({
					id: `${index}:cost`,
					label: "Cost",
					kind: "stat",
					old: change.old,
					new: change.new,
				});
				break;
			case "cooldown":
				rows.push({
					id: `${index}:${change.section}.cooldown`,
					label: "Cooldown",
					kind: "stat",
					old: change.old,
					new: change.new,
					// A longer cooldown is a nerf, so it reads like a negative stat.
					negativeAttribute: true,
				});
				break;
			case "stat":
				rows.push({
					id: `${index}:${change.section}.${change.key}`,
					key: change.key,
					label: change.label,
					kind: "stat",
					old: change.old,
					new: change.new,
					negativeAttribute: allProperties?.[change.key]?.negative_attribute,
				});
				break;
			case "row-added":
				rows.push({
					id: `${index}:${change.section}.${change.key}`,
					key: change.key,
					label: change.label,
					kind: "added",
					new: change.value,
					negativeAttribute: allProperties?.[change.key]?.negative_attribute,
				});
				break;
			case "row-removed":
				rows.push({
					id: `${index}:${change.section}.${change.key}`,
					key: change.key,
					label: change.label,
					kind: "removed",
					old: change.value,
					negativeAttribute: allProperties?.[change.key]?.negative_attribute,
				});
				break;
			default:
				break;
		}
	}

	const labelCounts = new Map<string, number>();
	for (const row of rows) {
		labelCounts.set(row.label, (labelCounts.get(row.label) ?? 0) + 1);
	}

	return rows.map(({ key, ...row }) => ({
		...row,
		label:
			key && (labelCounts.get(row.label) ?? 0) > 1
				? `${row.label} (${humaniseStatKey(key)})`
				: row.label,
	}));
}

/**
 * The hero path still runs on the raw payload diff - only items moved to the
 * tooltip projection - so its `Change[]` is adapted to the same row shape here
 * rather than forking `StatDelta` into two components.
 */
export function deltaRowsFromChanges(
	changes: Change[],
	allProperties: Item["properties"] | undefined,
	labelFor: (change: Change) => string,
): DeltaRow[] {
	return changes.map((change) => ({
		id: change.path.join("."),
		label: labelFor(change),
		kind:
			change.kind === "added"
				? "added"
				: change.kind === "removed"
					? "removed"
					: "stat",
		old: change.old as string | number | undefined,
		new: change.new as string | number | undefined,
		negativeAttribute: allProperties?.[statKeyOf(change)]?.negative_attribute,
	}));
}

const format = (value: unknown) => {
	if (value === null || value === undefined) return "—";
	if (typeof value === "number") {
		return Number.isInteger(value) ? String(value) : String(+value.toFixed(3));
	}
	if (typeof value === "string" || typeof value === "boolean") {
		return String(value);
	}
	return Array.isArray(value) ? `${value.length} entries` : "…";
};

const asNumber = (value: unknown) => {
	const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
	return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
};

/**
 * Direction colouring. `negative_attribute` on the underlying property encodes
 * which way is bad, so a rise in a negative stat is a nerf and vice versa.
 * Unknown / non-numeric moves stay neutral rather than guessing.
 */
function toneOf(row: DeltaRow) {
	if (row.kind === "added") return "text-emerald-300";
	if (row.kind === "removed") return "text-rose-300";
	const before = asNumber(row.old);
	const after = asNumber(row.new);
	if (before === null || after === null || before === after) {
		return "text-gray-200";
	}
	const better = row.negativeAttribute ? after < before : after > before;
	return better ? "text-emerald-300" : "text-rose-300";
}

export default function StatDelta({ row }: { row: DeltaRow }) {
	const tone = toneOf(row);
	return (
		<div className="flex flex-wrap items-baseline justify-between gap-2 px-2 py-1 text-sm">
			<span className="text-gray-300">{row.label}</span>
			{row.kind === "added" ? (
				<span className="flex items-baseline gap-1.5">
					<span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-bold text-[10px] text-emerald-300 uppercase tracking-wide">
						New
					</span>
					<b className={tone}>{format(row.new)}</b>
				</span>
			) : row.kind === "removed" ? (
				<span className="flex items-baseline gap-1.5">
					<span className="rounded bg-rose-500/20 px-1.5 py-0.5 font-bold text-[10px] text-rose-300 uppercase tracking-wide">
						Removed
					</span>
					<s className="text-gray-400">{format(row.old)}</s>
				</span>
			) : (
				<span className="flex items-baseline gap-1.5 font-bold">
					<s className="font-normal text-gray-500">{format(row.old)}</s>
					<span className="text-gray-500">&rarr;</span>
					<span className={tone}>{format(row.new)}</span>
				</span>
			)}
		</div>
	);
}
