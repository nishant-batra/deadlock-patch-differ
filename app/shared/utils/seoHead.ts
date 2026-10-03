import { SITE_URL } from "#/lib/patchNotification";

const ROBOTS =
	"index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

/**
 * A page's `head()`: the same title and description fanned out to the tab,
 * Open Graph and Twitter tags, plus the canonical URL. Site-wide tags (image,
 * card type, site name) live on the root route.
 */
export const seoHead = ({
	title,
	description,
	path,
}: {
	title: string;
	description: string;
	/** Absolute path, e.g. `/heroes/haze`. */
	path: string;
}) => ({
	meta: [
		{ title },
		{ name: "description", content: description },
		{ name: "robots", content: ROBOTS },
		{ property: "og:title", content: title },
		{ property: "og:description", content: description },
		{ property: "og:url", content: `${SITE_URL}${path}` },
		{ name: "twitter:title", content: title },
		{ name: "twitter:description", content: description },
	],
	links: [{ rel: "canonical", href: `${SITE_URL}${path}` }],
});
