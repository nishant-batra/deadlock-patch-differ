import { createFileRoute, redirect } from "@tanstack/react-router";
import Items from "#/pages/items";
import { fetchItems } from "#/pages/items/server";
import { itemTypes } from "#/shared/components/item-card/constants";
import { seoHead } from "#/shared/utils/seoHead";
import type { ItemSlotType, ItemsPage } from "#/types";

const isItemSlotType = (value: unknown): value is ItemSlotType =>
	itemTypes.includes(value as ItemSlotType);

export const Route = createFileRoute("/_layout/items")({
	// `?type=` is from when each slot type was its own tab - every slot is on
	// one page now, so old links land on that slot's section instead.
	validateSearch: (search: Record<string, unknown>): { type?: ItemSlotType } =>
		isItemSlotType(search.type) ? { type: search.type } : {},
	beforeLoad: ({ search: { type } }) => {
		if (type) throw redirect({ to: "/items", hash: type, replace: true });
	},
	head: ({ loaderData }: { loaderData?: ItemsPage }) => {
		const itemCount = loaderData?.items.length ?? 0;
		const title = `All ${itemCount > 0 ? `${itemCount} ` : ""}Deadlock Shop Items - Weapon, Vitality & Spirit Tiers | Deadlock Patch Comparator`;
		const description = `Browse all ${itemCount > 0 ? `${itemCount} ` : ""}Deadlock shop items. View item costs, component trees, active abilities, and stat scalings across Weapon, Vitality, and Spirit tiers.`;

		return seoHead({ title, description, path: "/items" });
	},
	loader: async () => fetchItems(),
	component: RouteComponent,
});

function RouteComponent() {
	// Annotated for the same reason as the index route: the generated route tree
	// and `useLoaderData()` reference each other, so inference yields `any`.
	const { items }: ItemsPage = Route.useLoaderData();

	return <Items items={items} />;
}
