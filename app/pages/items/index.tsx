import clsx from "clsx";
import CutFrame from "#/shared/components/cut-frame";
import { AMBER_BORDER } from "#/shared/components/cut-frame/constants";
import ItemCard from "#/shared/components/item-card";
import { itemTypes } from "#/shared/components/item-card/constants";
import type { ItemSlotType, ItemsPage } from "#/types";

export default function Items({
	items,
	type,
	onTypeChange,
}: {
	items: ItemsPage["items"];
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
					<CutFrame key={itemType} color={AMBER_BORDER}>
						<button
							type="button"
							aria-pressed={type === itemType}
							className={clsx(
								"cut-corner px-3 py-1.5 capitalize",
								type === itemType && "bg-amber-500/20 font-bold",
							)}
							onClick={() => onTypeChange(itemType)}
						>
							{itemType}
						</button>
					</CutFrame>
				))}
			</div>
			<div className="masonary">
				{[...items]
					.sort((a, b) => (a.item?.cost ?? 0) - (b.item?.cost ?? 0))
					.map(({ item, changes }) => (
						<ItemCard
							item={item}
							changes={changes}
							isChanged={Boolean(changes?.length)}
							key={item.id}
						/>
					))}
			</div>
		</main>
	);
}
