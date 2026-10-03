import CutFrame from "#/shared/components/cut-frame";
import ItemCard from "#/shared/components/item-card";
import { colorsFor } from "#/shared/components/item-card/constants";
import type { ItemSlotType, ItemsPage } from "#/types";

/**
 * One slot type's block on `/items`. `id` is the slot type, so the slot
 * switch, `/items#spirit`, and old `?type=spirit` links (redirected) all
 * land here.
 */
export default function ItemSection({
	type,
	items,
	targetRef,
}: {
	type: ItemSlotType;
	items: ItemsPage["items"];
	/** Registers each card with the page search, by item name. */
	targetRef: (name: string) => (element: HTMLElement | null) => void;
}) {
	const { primary, highlight } = colorsFor(type);

	return (
		// Offset by the navbar plus the sticky slot switch (4rem on one row), so a
		// jump to `#slot` lands the heading just below both.
		<section
			id={type}
			className="mb-8 scroll-mt-[calc(var(--nav-height)+var(--sticky-bar-height,4rem))]"
		>
			<CutFrame color={primary} width={2} className="flex">
				<h2
					className="cut-corner flex flex-1 items-baseline gap-2 px-3 py-2 font-bold text-lg capitalize"
					style={{ background: highlight }}
				>
					{type}
					<span className="font-normal text-gray-400 text-sm">
						{items.length} items
					</span>
				</h2>
			</CutFrame>
			{/* Columns drop a card's top margin when it starts a new column, so
			    only the first column kept its gap - the gap comes from padding
			    instead, and the first card's own margin is zeroed to match.
			    Search jumps land a card below the bars, a card-gap clear. */}
			<div className="masonary pt-3 [&>*]:scroll-mt-[calc(var(--nav-height)+var(--sticky-bar-height,4rem)+0.75rem)] [&>:first-child]:mt-0">
				{items.map(({ item, changes }) => (
					<ItemCard
						item={item}
						changes={changes}
						isChanged={Boolean(changes?.length)}
						ref={targetRef(item.name)}
						key={item.id}
					/>
				))}
			</div>
		</section>
	);
}
