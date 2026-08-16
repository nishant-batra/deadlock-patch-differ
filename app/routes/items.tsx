import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import ItemCard from "#/components/item-card";
import { itemTypes } from "#/components/item-card/constants";
import { getAllItems } from "#/server/patchService";
import type { Item, ItemSlotType } from "#/types";

// Return type is explicit: without it the server-fn boundary widens the loader
// data to `any` and every downstream callback loses its types.
//
// The `setResponseHeader` call that was here threw on every render - see the
// note in routes/index.tsx.
const fetchItems = createServerFn({ method: "GET" }).handler(
	// Already filtered at ingest: shop items only, no Street Brawl (tier 5).
	async (): Promise<Item[]> => getAllItems(),
);

export const Route = createFileRoute("/items")({
	head: ({ loaderData }: { loaderData?: Item[] }) => {
		const itemCount = loaderData?.length ?? 0;
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
	loader: async () => fetchItems(),
	component: Items,
});

function Items() {
	// Annotated for the same reason as the index route: the generated route tree
	// and `useLoaderData()` reference each other, so inference yields `any`.
	const itemsData: Item[] = Route.useLoaderData();
	const [itemsFilter, setItemsFilter] = useState<ItemSlotType>(itemTypes[0]);

	return (
		<main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
			<div className="mb-4 flex gap-2">
				{itemTypes.map((itemType) => (
					<button
						type="button"
						key={itemType}
						aria-pressed={itemsFilter === itemType}
						className={`rounded-xl border border-amber-500 p-2 capitalize ${
							itemsFilter === itemType ? "bg-amber-500/20 font-bold" : ""
						}`}
						onClick={() => setItemsFilter(itemType)}
					>
						{itemType}
					</button>
				))}
			</div>
			<div className="masonary">
				{itemsData
					.filter((item) => item.item_slot_type === itemsFilter)
					.sort((a, b) => (a?.cost ?? 0) - (b?.cost ?? 0))
					.map((card) => (
						<ItemCard item={card} key={card.id} />
					))}
			</div>
		</main>
	);
}
