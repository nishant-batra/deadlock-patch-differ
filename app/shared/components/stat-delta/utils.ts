import { humaniseStatKey } from "#/shared/utils/statLabels";
import type { DisplayChange, Item } from "#/types";

/** A single row in the change strip, normalised from a `DisplayChange`. */
export type DeltaRow = {
	id: string;
	label: string;
	kind: "stat" | "added" | "removed";
	old?: string | number;
	new?: string | number;
	negativeAttribute?: boolean;
	/** Mirrors `ItemProperty.prefix`/`.postfix` - same sign/unit rendering as the tooltip chip. */
	prefix?: string;
	postfix?: string;
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
					postfix: allProperties?.AbilityCooldown?.postfix,
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
					prefix: allProperties?.[change.key]?.prefix,
					postfix: allProperties?.[change.key]?.postfix,
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
					prefix: allProperties?.[change.key]?.prefix,
					postfix: allProperties?.[change.key]?.postfix,
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
					prefix: allProperties?.[change.key]?.prefix,
					postfix: allProperties?.[change.key]?.postfix,
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

export const formatDeltaValue = (value: unknown) => {
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
export function deltaDirection({
	kind,
	old,
	new: next,
	negativeAttribute,
}: DeltaRow): "better" | "worse" | "neutral" {
	if (kind === "added") return "better";
	if (kind === "removed") return "worse";
	const before = asNumber(old);
	const after = asNumber(next);
	if (before === null || after === null || before === after) return "neutral";
	const better = negativeAttribute ? after < before : after > before;
	return better ? "better" : "worse";
}

const TONES = {
	better: "text-emerald-300",
	worse: "text-rose-300",
	neutral: "text-gray-200",
} as const;

export const toneOfDeltaRow = (row: DeltaRow) => TONES[deltaDirection(row)];
