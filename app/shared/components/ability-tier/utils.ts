import { shouldAppendPostfix } from "#/shared/utils/statFormatting";
import type { TierDiff } from "#/types";

type Row = TierDiff["rows"][number];

/** Ability points each tier costs - the number the in-game card prints on it. */
export const TIER_COST = { 1: 1, 2: 2, 3: 5 } as const;

const formatNumber = (value: string | number | undefined) => {
	if (value === undefined || value === null) return "—";
	if (typeof value === "number") {
		return Number.isInteger(value) ? String(value) : String(+value.toFixed(3));
	}
	return String(value);
};

/**
 * An upgrade bonus is always a delta on top of the base value, so its sign
 * comes from the number itself. The property's own `prefix` describes the base
 * value and is ignored here - it's missing on most stats (no `+`), and
 * `{s:sign}`/`-` on a delta produce `+-10` or flip a positive bonus.
 */
export const formatTierBonus = (
	value: string | number | undefined,
	{ postfix }: Pick<Row, "postfix">,
) => {
	const text = formatNumber(value);
	const sign = Number.parseFloat(text) > 0 && !text.startsWith("+") ? "+" : "";
	return `${sign}${text}${shouldAppendPostfix(value, postfix) ? postfix : ""}`;
};

/** Anything in the tier moved this patch - its copy or any of its bonuses. */
export const isTierTouched = ({ text, rows }: TierDiff) =>
	Boolean(text) || rows.some(({ kind }) => kind !== "equal");
