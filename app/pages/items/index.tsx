import { colorsFor, itemTypes } from "#/shared/components/item-card/constants";
import SearchInput from "#/shared/components/search-input";
import { useScrollTargets } from "#/shared/components/search-input/useScrollTargets";
import type { ItemsPage } from "#/types";
import ItemSection from "./item-section";
import SlotSwitch from "./slot-switch";

export default function Items({ items }: { items: ItemsPage["items"] }) {
	const { targetRef, scrollTo } = useScrollTargets();
	const entries = items.map(
		({ item: { name, shop_image_webp, item_slot_type } }) => ({
			name,
			icon: shop_image_webp,
			color: colorsFor(item_slot_type).primary,
		}),
	);

	return (
		<main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
			<h1 className="mb-1 font-extrabold text-2xl">All Deadlock Items</h1>
			<p className="mb-6 text-gray-400 text-sm">
				Browse every Deadlock shop item with full item stats — costs, component
				trees, active abilities, and stat scaling across Weapon, Vitality, and
				Spirit tiers.
			</p>
			<SlotSwitch>
				<SearchInput
					entries={entries}
					onSelect={scrollTo}
					placeholder="Search items"
					className="ml-auto w-full sm:w-72"
				/>
			</SlotSwitch>
			{itemTypes.map((type) => (
				<ItemSection
					key={type}
					type={type}
					items={items
						.filter(({ item }) => item.item_slot_type === type)
						.sort((a, b) => (a.item.cost ?? 0) - (b.item.cost ?? 0))}
					targetRef={targetRef}
				/>
			))}
		</main>
	);
}
