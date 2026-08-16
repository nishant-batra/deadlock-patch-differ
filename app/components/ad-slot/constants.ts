/**
 * Set VITE_ADSENSE_PUBLISHER_ID in the environment once AdSense approves the
 * site. Unset in dev/preview by default - the loader script and ad slots
 * simply don't render until it's configured.
 */
export const ADSENSE_PUBLISHER_ID: string | undefined = import.meta.env
	.VITE_ADSENSE_PUBLISHER_ID;
