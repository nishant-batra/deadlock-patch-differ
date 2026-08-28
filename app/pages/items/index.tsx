import ItemCard from "#/shared/components/item-card";
import { itemTypes } from "#/shared/components/item-card/constants";
import type { Item, ItemSlotType } from "#/types";

export default function Items({
	items,
	type,
	onTypeChange,
}: {
	items: Item[];
	type: ItemSlotType;
	onTypeChange: (type: ItemSlotType) => void;
}) {
	return (
		<main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
			<h1 className="mb-1 font-extrabold text-2xl">All Deadlock Items</h1>
			<p className="mb-6 text-gray-400 text-sm">
				Browse every Deadlock shop item with full item stats — costs, component
				trees, active abilities, and stat scaling across Weapon, Vitality, and
				Spirit tiers.
			</p>
			<div className="mb-4 flex gap-2">
				{itemTypes.map((itemType) => (
					<button
						type="button"
						key={itemType}
						aria-pressed={type === itemType}
						className={`rounded-xl border border-amber-500 p-2 capitalize ${
							type === itemType ? "bg-amber-500/20 font-bold" : ""
						}`}
						onClick={() => onTypeChange(itemType)}
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
