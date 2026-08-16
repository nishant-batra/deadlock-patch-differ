import { useRouterState } from "@tanstack/react-router";

export function useIsRouteLoading() {
	// Not `s.status`: the router only flips it back to "idle" from the
	// Transitioner's pending -> settled effect, which never runs after an SSR
	// hydration (the page arrives already settled), so it stays "pending" for
	// the whole first visit. `isLoading`/`isTransitioning` are plain booleans
	// that are only true while a navigation is actually in flight.
	return useRouterState({
		select: (s) => s.isLoading || s.isTransitioning,
	});
}
