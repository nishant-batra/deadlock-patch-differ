// app/pages/items/server.ts
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { itemChangesByName, readItemsView } from "#/server/core";
import type { ItemSlotType, ItemsPage } from "#/types";

/**
 * Filtered to one slot type server-side rather than shipping the full ~1.2 MB
 * catalog and letting the `/items` page filter client-side - `totalCount`
 * (unfiltered) is carried alongside so the page's SEO copy still reports the
 * whole catalog, not just the active tab.
 *
 * Each item is joined against the same `itemChangesByName()` diff the Changes
 * page uses, so a catalog card can show the same "Changed this patch" flag
 * and delta rows without re-deriving them.
 */
export function getItemsPage(slotType: ItemSlotType): ItemsPage {
	const items = readItemsView().items;
	const changesByName = itemChangesByName();
	return {
		items: items
			.filter((item) => item.item_slot_type === slotType)
			.map((item) => ({ item, changes: changesByName.get(item.name) })),
		totalCount: items.length,
	};
}

// Return type is explicit: without it the server-fn boundary widens the loader
// data to `any` and every downstream callback loses its types.
export const fetchItems = createServerFn({ method: "GET" })
	.inputValidator((slotType: ItemSlotType) => slotType)
	// Already filtered at ingest: shop items only, no Street Brawl (tier 5).
	// Filtered again here by slot type, server-side, so a tab switch only ever
	// ships the ~400 KB slice being viewed instead of the whole ~1.2 MB catalog.
	.handler(async ({ data }): Promise<ItemsPage> => {
		// Rebuilt by the deploy hook whenever new artifacts are committed.
		setResponseHeader("Cache-Control", "public, s-maxage=31536000, immutable");
		return getItemsPage(data);
	});
