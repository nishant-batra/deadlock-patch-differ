import type { NoteRef } from "#/types";
import HeroChanges from "./hero-changes";
import ItemChanges from "./item-changes";
import SectionHeading from "./section-heading";
import type { ChangesPayload } from "./server";

/**
 * The newest hotfix, above the rest of the patch. Its heroes and items are
 * left out of the patch's sections, and their cards show the whole change -
 * patch and hotfix together - so nothing from the patch goes missing.
 */
export default function HotfixSection({
	hotfix: { items, heroes },
	note,
}: {
	hotfix: ChangesPayload["hotfix"];
	note?: NoteRef;
}) {
	const { added, removed, changed } = items;
	const count = heroes.length + added.length + removed.length + changed.length;
	if (count === 0) return null;

	return (
		<section
			id="hotfix"
			className="mb-12 border-amber-400/40 border-l-2 pl-4 sm:pl-6"
		>
			<SectionHeading count={count} source={note}>
				Hotfix
			</SectionHeading>
			<p className="-mt-2 mb-6 text-gray-400 text-sm">
				These cards show the full change since the patch, hotfix included.
			</p>
			<HeroChanges heroes={heroes} nested legend />
			<div className={heroes.length > 0 ? "mt-10" : undefined}>
				<ItemChanges items={items} nested />
			</div>
		</section>
	);
}
