// app/utils/heroSlug.ts

/**
 * Kebab-cases a hero's display name for use in `/heroes/$heroSlug` URLs.
 * Single source of truth - both the route loader (finding a hero by slug) and
 * every link-generation call site import this, so they can never drift apart.
 *
 * Lowercases, then collapses any run of non-alphanumeric characters (spaces,
 * apostrophes, ampersands, punctuation) into a single hyphen, and trims
 * leading/trailing hyphens. Verified against the full live roster, including
 * the two names with punctuation: "Mo & Krill" -> "mo-krill", and
 * "The Doorman" -> "the-doorman".
 */
export function heroSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
