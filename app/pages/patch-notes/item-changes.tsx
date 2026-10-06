import EmptyState from "#/shared/components/empty-state";
import ItemCard from "#/shared/components/item-card";
import type { ItemChanges as ItemChangesData } from "#/types";
import SectionHeading from "./section-heading";

/**
 * Added, removed and changed item cards. The patch always shows its "Item
 * changes" heading, empty or not; the hotfix (`hideEmpty`) only shows what it
 * has.
 */
export default function ItemChanges({
	items: { added, removed, changed },
	hideEmpty = false,
}: {
	items: ItemChangesData;
	hideEmpty?: boolean;
}) {
	return (
		<>
			{added.length > 0 && (
				<div className="mb-10">
					<SectionHeading as="h3" count={added.length}>
						Added items
					</SectionHeading>
					<div className="masonary">
						{added.map((item) => (
							<ItemCard item={item} isNew key={item.id} />
						))}
					</div>
				</div>
			)}

			{removed.length > 0 && (
				<div className="mb-10">
					<SectionHeading as="h3" count={removed.length}>
						Removed items
					</SectionHeading>
					<div className="masonary">
						{removed.map((item) => (
							<ItemCard item={item} isRemoved key={item.id} />
						))}
					</div>
				</div>
			)}

			{(!hideEmpty || changed.length > 0) && (
				<>
					<SectionHeading as="h3" count={changed.length}>
						Item changes
					</SectionHeading>
					{changed.length === 0 ? (
						<EmptyState>No item changes in this patch.</EmptyState>
					) : (
						<div className="masonary">
							{changed.map(({ item, changes }) => (
								<ItemCard item={item} changes={changes} key={item.id} />
							))}
						</div>
					)}
				</>
			)}
		</>
	);
}
