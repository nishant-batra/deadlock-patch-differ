import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import ItemCard from "#/components/item-card";
import { itemTypes } from "#/components/item-card/constants";
import { getItemsPage } from "#/server/patchService";
import type { ItemSlotType, ItemsPage } from "#/types";

const isItemSlotType = (value: unknown): value is ItemSlotType =>
	itemTypes.includes(value as ItemSlotType);

// Return type is explicit: without it the server-fn boundary widens the loader
// data to `any` and every downstream callback loses its types.
//
// The `setResponseHeader` call that was here threw on every render - see the
// note in routes/index.tsx.
const fetchItems = createServerFn({ method: "GET" })
	.inputValidator((slotType: ItemSlotType) => slotType)
	// Already filtered at ingest: shop items only, no Street Brawl (tier 5).
	// Filtered again here by slot type, server-side, so a tab switch only ever
	// ships the ~400 KB slice being viewed instead of the whole ~1.2 MB catalog.
	.handler(async ({ data }): Promise<ItemsPage> => getItemsPage(data));

export const Route = createFileRoute("/items")({
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
				{ property: "og:url", content: "https://deadlockpatch.com/items" },
				{ name: "twitter:title", content: title },
				{ name: "twitter:description", content: description },
			],
			links: [{ rel: "canonical", href: "https://deadlockpatch.com/items" }],
		};
	},
	loader: async ({ deps }) => fetchItems({ data: deps.type }),
	component: Items,
});

function Items() {
	// Annotated for the same reason as the index route: the generated route tree
	// and `useLoaderData()` reference each other, so inference yields `any`.
	const { items }: ItemsPage = Route.useLoaderData();
	const { type } = Route.useSearch();
	const navigate = Route.useNavigate();

	return (
		<main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
			<div className="mb-4 flex gap-2">
				{itemTypes.map((itemType) => (
					<button
						type="button"
						key={itemType}
						aria-pressed={type === itemType}
						className={`rounded-xl border border-amber-500 p-2 capitalize ${
							type === itemType ? "bg-amber-500/20 font-bold" : ""
						}`}
						onClick={() =>
							navigate({ search: { type: itemType }, replace: true })
						}
					>
						{itemType}
					</button>
				))}
			</div>
			<div className="masonary">
				{[...items]
					.sort((a, b) => (a?.cost ?? 0) - (b?.cost ?? 0))
					.map((card) => (
						<ItemCard item={card} key={card.id} />
					))}
			</div>
		</main>
	);
}
