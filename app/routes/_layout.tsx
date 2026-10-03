// app/routes/_layout.tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";
import Navbar from "#/layout/navbar";
import ScrollToTop from "#/layout/scroll-to-top";
import { fetchPatchMeta } from "#/layout/server";

export const Route = createFileRoute("/_layout")({
	loader: async () => fetchPatchMeta(),
	component: LayoutComponent,
});

function LayoutComponent() {
	const meta = Route.useLoaderData();

	return (
		<>
			<Navbar meta={meta} />
			<Outlet />
			<ScrollToTop />
		</>
	);
}
