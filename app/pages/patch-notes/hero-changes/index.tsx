import type { OpenState } from "#/shared/components/ability-row";
import EmptyState from "#/shared/components/empty-state";
import type { ChangedHero } from "#/types";
import ChangedHeroCard from "../hero-card";
import HeroLegend from "../hero-legend";
import SectionHeading from "../section-heading";

/**
 * Changed hero cards. The patch always shows its heading, empty or not; the
 * hotfix (`hideEmpty`) only shows what it has. The legend goes with whichever
 * list comes first on the page. Which popover is open is owned by the page
 * (`useAbilityCycle`), so prev/next run across both lists.
 */
export default function HeroChanges({
	heroes,
	hideEmpty = false,
	legend = false,
	openStateFor,
}: {
	heroes: ChangedHero[];
	/** Each card's slice of the page's open-ability state, by its place here. */
	openStateFor: (card: number) => OpenState;
	hideEmpty?: boolean;
	legend?: boolean;
}) {
	if (hideEmpty && heroes.length === 0) return null;
	return (
		<>
			<SectionHeading as="h3" count={heroes.length}>
				Hero changes
			</SectionHeading>
			{heroes.length === 0 ? (
				<EmptyState>No hero changes in this patch.</EmptyState>
			) : (
				<>
					{legend && <HeroLegend />}
					<div className="masonary">
						{heroes.map((changed, card) => (
							<ChangedHeroCard
								key={changed.hero.id}
								{...changed}
								openState={openStateFor(card)}
							/>
						))}
					</div>
				</>
			)}
		</>
	);
}
