// app/pages/items/server.ts
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { itemChangesByName, readItemsView } from "#/server/core";
import type { ItemsPage } from "#/types";
import { toCatalogItem } from "./utils";

/**
 * The whole catalog, every slot type - the `/items` page shows them all as
 * sections of one scrolling page. Each item is trimmed to what its card
 * renders (`toCatalogItem`), which keeps the full catalog to ~490 KB.
 *
 * Each item is joined against the same `itemChangesByName()` diff the Changes
 * page uses, so a catalog card can show the same "Changed this patch" flag
 * and delta rows without re-deriving them.
 */
export function getItemsPage(): ItemsPage {
	const changesByName = itemChangesByName();
	return {
		items: readItemsView().items.map((item) => {
			const changes = changesByName.get(item.name);
			return { item: toCatalogItem(item, changes), changes };
		}),
	};
}

// Return type is explicit: without it the server-fn boundary widens the loader
// data to `any` and every downstream callback loses its types.
export const fetchItems = createServerFn({ method: "GET" })
	// Already filtered at ingest: shop items only, no Street Brawl (tier 5).
	.handler(async (): Promise<ItemsPage> => {
		// Rebuilt by the deploy hook whenever new artifacts are committed.
		setResponseHeader("Cache-Control", "public, s-maxage=31536000, immutable");
		return getItemsPage();
	});
