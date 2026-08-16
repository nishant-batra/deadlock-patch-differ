// app/utils/statFormatting.ts
//
// Shared between `PropertyList` (items' inline tooltip chips) and `StatDelta`
// (the change-strip rows used by items, abilities, and heroes) so a property's
// `prefix`/`postfix` render the same way wherever a value shows up.

/** The handful of prefix tokens the API sends instead of literal text. */
export const RESPONSE_CONVERSION_MAP: Record<string, string> = {
	"{s:sign}": "+",
};

export const resolvePrefix = (prefix?: string) =>
	prefix ? (RESPONSE_CONVERSION_MAP[prefix] ?? prefix) : "";

/**
 * Some values already carry their unit in the string itself (`"70m"`), so the
 * postfix would double up if appended blindly.
 */
export const shouldAppendPostfix = (value: unknown, postfix?: string) =>
	Boolean(postfix) && !String(value ?? "").endsWith(postfix as string);
