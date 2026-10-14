// app/lib/statValue.ts

/**
 * Whether a payload stat value means "nothing". Values arrive as numbers (0),
 * bare strings ("0") and strings with a unit baked in ("0m", "0s", "0%") -
 * Sleep Dagger's radius went `RicochetRadius: "0m"` -> `ExplosionRadius: "0m"`
 * in 6722, which is no change at all. A trailing unit is stripped before the
 * numeric check; anything else non-numeric (a range like "0 / 0.75") is a
 * real value.
 */
export const isEmptyStatValue = (value: unknown) => {
	if (value === undefined || value === null || value === "") return true;
	if (typeof value !== "number" && typeof value !== "string") return false;
	// Only a unit is stripped - a word ("Slows") must not strip down to "" and
	// read as 0.
	const number = String(value).replace(/\s*[a-z%]+$/i, "");
	return number.trim() !== "" && Number(number) === 0;
};

/**
 * A number with its floating-point noise dropped. The API derives rates like
 * `bullets_per_second` by division, and re-deriving them in build 6779 moved
 * 3.8095238095238098 -> 3.8095238095238093 - no change at all, but it showed
 * seven heroes as hotfixed. 12 significant digits is far past anything a card
 * shows.
 */
export const settleStatValue = (value: unknown) =>
	typeof value === "number" ? Number(value.toPrecision(12)) : value;

/** Whether two stat values are the same, ignoring floating-point noise. */
export const sameStatValue = (a: unknown, b: unknown) =>
	String(settleStatValue(a)) === String(settleStatValue(b));
