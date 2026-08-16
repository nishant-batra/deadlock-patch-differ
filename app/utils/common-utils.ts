/**
 * `2026-07-23T20:29:33` (no zone) or `2026-07-09T19:26:55Z` -> `23 July 2026`.
 * Formatted in UTC so server and client render the same string.
 */
export const formatPatchDate = (value: string) => {
	const parsed = new Date(
		/[Zz]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`,
	);
	if (Number.isNaN(parsed.getTime())) return value;
	return new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(parsed);
};
