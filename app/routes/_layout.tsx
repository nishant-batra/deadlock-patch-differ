// app/routes/_layout.tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";
import Navbar from "#/layout/navbar";
import ScrollToTop from "#/layout/scroll-to-top";
import { fetchPatchMeta } from "#/layout/server";
import AdSlot from "#/shared/components/ad-slot";

export const Route = createFileRoute("/_layout")({
	loader: async () => fetchPatchMeta(),
	component: LayoutComponent,
});

function LayoutComponent() {
	const meta = Route.useLoaderData();

	return (
		<>
			<Navbar meta={meta} />
			<div className="ad-rail-row">
				<AdSlot
					slotId="TODO-ad-unit-sticky-rail"
					wrapperClassName="ad-rail-wrap"
					className="ad-rail"
				/>
				<div className="min-w-0 flex-1">
					<Outlet />
				</div>
			</div>
			<ScrollToTop />
		</>
	);
}
