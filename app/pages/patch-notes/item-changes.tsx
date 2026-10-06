import EmptyState from "#/shared/components/empty-state";
import ItemCard from "#/shared/components/item-card";
import type { ItemChanges as ItemChangesData, NoteRef } from "#/types";
import SectionHeading from "./section-heading";

/**
 * Added, removed and changed item cards. The patch always shows its "Item
 * changes" heading, empty or not; the hotfix (`nested`) only shows what it has.
 */
export default function ItemChanges({
	items: { added, removed, changed },
	source,
	nested = false,
}: {
	items: ItemChangesData;
	source?: NoteRef;
	nested?: boolean;
}) {
	const as = nested ? "h3" : "h2";
	return (
		<>
			{added.length > 0 && (
				<div className="mb-10">
					<SectionHeading as={as} count={added.length}>
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
					<SectionHeading as={as} count={removed.length}>
						Removed items
					</SectionHeading>
					<div className="masonary">
						{removed.map((item) => (
							<ItemCard item={item} isRemoved key={item.id} />
						))}
					</div>
				</div>
			)}

			{(!nested || changed.length > 0) && (
				<>
					<SectionHeading as={as} count={changed.length} source={source}>
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
