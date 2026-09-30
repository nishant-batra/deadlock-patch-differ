// app/lib/statValue.ts

/**
 * Whether a payload stat value means "nothing". Values arrive as numbers (0),
 * bare strings ("0") and strings with a unit baked in ("0m", "0s", "0%") -
 * Sleep Dagger's radius went `RicochetRadius: "0m"` -> `ExplosionRadius: "0m"`
 * in 6722, which is no change at all. A trailing unit is stripped before the
 * numeric check; anything else non-numeric (a range like "0 / 0.75") is a
 * real value.
 */
export const isEmptyStatValue = (value: unknown) =>
	value === undefined ||
	value === null ||
	value === "" ||
	Number(String(value).replace(/\s*[a-z%]+$/i, "")) === 0;
