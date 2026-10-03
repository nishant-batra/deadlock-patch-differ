// app/utils/statFormatting.ts
//
// Shared between `PropertyList` (items' inline tooltip chips) and `StatDelta`
// (the change-strip rows used by items, abilities, and heroes) so a property's
// `prefix`/`postfix` render the same way wherever a value shows up.

/** The handful of prefix tokens the API sends instead of literal text. */
const RESPONSE_CONVERSION_MAP: Record<string, string> = {
	"{s:sign}": "+",
};

export const resolvePrefix = (prefix?: string) =>
	prefix ? (RESPONSE_CONVERSION_MAP[prefix] ?? prefix) : "";

/**
 * Some values already carry their unit in the string itself (`"70m"`), so the
 * postfix would double up if appended blindly. Metre values always carry it,
 * and their postfix is sometimes `" m"` (leading space) which the suffix
 * check misses - so an `m` postfix is never appended.
 */
export const shouldAppendPostfix = (value: unknown, postfix?: string) =>
	Boolean(postfix) &&
	postfix?.trim() !== "m" &&
	!String(value ?? "").endsWith(postfix as string);

/**
 * A property still gated behind an unpurchased ability upgrade tier renders at
 * its base value of 0 - real information, but only the tier that unlocks it
 * says so; a bare "0" with no context is noise. Diffed properties are exempt:
 * a change *to* or *from* 0 is still a real delta worth showing. So are
 * `tooltip_is_elevated` properties - Valve marked them worth featuring
 * regardless of value, so hiding them at 0 would hide that call.
 */
export const isPlaceholderZero = (
	{
		value,
		tooltip_is_elevated,
	}: { value?: string | number; tooltip_is_elevated?: boolean },
	changed: boolean,
) => !changed && !tooltip_is_elevated && (value === 0 || value === "0");
