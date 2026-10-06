import GeneralNote from "./general-note";
import HeroChanges from "./hero-changes";
import ItemChanges from "./item-changes";
import SectionBar from "./section-bar";
import SectionHeading from "./section-heading";
import type { HotfixChanges } from "./server";
import { BELOW_BAR, itemCount } from "./utils";

/**
 * Every hotfix since the patch, merged, above the patch itself. Its own sticky
 * bar hands over to the patch's once it scrolls past.
 */
export default function HotfixSection({
	hotfix,
}: {
	hotfix: HotfixChanges | null;
}) {
	if (!hotfix) return null;
	const { builds, builtAt, note, general, items, heroes } = hotfix;
	const itemTotal = itemCount(items);
	if (heroes.length + itemTotal === 0 && !general) return null;

	return (
		<section id="hotfix" className="mb-12">
			<SectionBar
				label="Hotfix"
				tone="hotfix"
				builds={builds}
				builtAt={builtAt}
				note={note}
				links={[
					...(heroes.length > 0
						? [
								{
									href: "#hotfix-heroes",
									label: "Heroes",
									count: heroes.length,
								},
							]
						: []),
					...(itemTotal > 0
						? [{ href: "#hotfix-items", label: "Items", count: itemTotal }]
						: []),
					...(general ? [{ href: "#hotfix-general", label: "General" }] : []),
				]}
			/>
			{heroes.length > 0 && (
				<section id="hotfix-heroes" className={`mb-10 ${BELOW_BAR}`}>
					<HeroChanges heroes={heroes} hideEmpty legend />
				</section>
			)}
			{itemTotal > 0 && (
				<section id="hotfix-items" className={`mb-10 ${BELOW_BAR}`}>
					<ItemChanges items={items} hideEmpty />
				</section>
			)}
			{general && (
				<section id="hotfix-general" className={BELOW_BAR}>
					<SectionHeading as="h3" source={general}>
						General
					</SectionHeading>
					<GeneralNote note={general} />
				</section>
			)}
		</section>
	);
}
