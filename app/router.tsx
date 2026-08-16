// app/router.tsx
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const router = createRouter({
		routeTree,
		scrollRestoration: true,
	});

	return router;
}

// Without this, route-scoped hooks (`useSearch`, `useNavigate`, `Link`, …)
// can't see each route's actual search/params schema and fall back to loose
// generic types - e.g. `navigate({ search: {...} })` stops type-checking
// against a route's `validateSearch` output.
declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
