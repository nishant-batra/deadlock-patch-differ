import { useRouterState } from "@tanstack/react-router";

export function useIsRouteLoading() {
	// Not `s.status` directly: older routers left it "pending" after an SSR
	// hydration. Since router-core 1.171 `isLoading` is derived from it and the
	// status store starts "idle", so this is only true while a navigation is in
	// flight. (`isTransitioning` no longer exists.)
	return useRouterState({ select: (s) => s.isLoading });
}
