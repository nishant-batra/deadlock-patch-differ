import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import Card from "#/components/card";
import { itemTypes } from "#/components/constants";
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
	loader: async () => fetchItems(),
	component: Items,
});

function Items() {
	// Annotated for the same reason as the index route: the generated route tree
	// and `useLoaderData()` reference each other, so inference yields `any`.
	const itemsData: Item[] = Route.useLoaderData();
	const [itemsFilter, setItemsFilter] = useState<ItemSlotType>(itemTypes[0]);

	return (
		<div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
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
						<Card item={card} key={card.id} />
					))}
			</div>
		</div>
	);
}
