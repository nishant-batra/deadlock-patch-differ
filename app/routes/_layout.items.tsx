import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import Items from "#/pages/items";
import { fetchItems } from "#/pages/items/server";
import { itemTypes } from "#/shared/components/item-card/constants";
import type { ItemSlotType, ItemsPage } from "#/types";

const isItemSlotType = (value: unknown): value is ItemSlotType =>
	itemTypes.includes(value as ItemSlotType);

export const Route = createFileRoute("/_layout/items")({
	validateSearch: (
		search: Record<string, unknown>,
	): { type: ItemSlotType } => ({
		type: isItemSlotType(search.type) ? search.type : itemTypes[0],
	}),
	// Default tab shouldn't show up as `?type=weapon` in the URL.
	search: { middlewares: [stripSearchParams({ type: itemTypes[0] })] },
	loaderDeps: ({ search }) => ({ type: search.type }),
	head: ({ loaderData }: { loaderData?: ItemsPage }) => {
		const itemCount = loaderData?.totalCount ?? 0;
		const title = `All ${itemCount > 0 ? `${itemCount} ` : ""}Deadlock Shop Items — Weapon, Vitality & Spirit Tiers | Deadlock Patch Comparator`;
		const description = `Browse all ${itemCount > 0 ? `${itemCount} ` : ""}Deadlock shop items. View item costs, component trees, active abilities, and stat scalings across Weapon, Vitality, and Spirit tiers.`;

		return {
			meta: [
				{ title },
				{ name: "description", content: description },
				{
					name: "robots",
					content:
						"index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
				},
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
				{
					property: "og:url",
					content: "https://deadlockpatch.vercel.app/items",
				},
				{ name: "twitter:title", content: title },
				{ name: "twitter:description", content: description },
			],
			links: [
				{ rel: "canonical", href: "https://deadlockpatch.vercel.app/items" },
			],
		};
	},
	loader: async ({ deps }) => fetchItems({ data: deps.type }),
	component: RouteComponent,
});

function RouteComponent() {
	// Annotated for the same reason as the index route: the generated route tree
	// and `useLoaderData()` reference each other, so inference yields `any`.
	const { items }: ItemsPage = Route.useLoaderData();
	const { type } = Route.useSearch();
	const navigate = Route.useNavigate();

	return (
		<Items
			items={items}
			type={type}
			onTypeChange={(next) =>
				navigate({ search: { type: next }, replace: true })
			}
		/>
	);
}
