import EmptyState from "#/shared/components/empty-state";
import type { ChangedHero, NoteRef } from "#/types";
import ChangedHeroCard from "./hero-card";
import HeroLegend from "./hero-legend";
import SectionHeading from "./section-heading";

/**
 * Changed hero cards. The patch always shows its heading, empty or not; the
 * hotfix (`nested`) only shows what it has. The legend goes with whichever
 * list comes first on the page.
 */
export default function HeroChanges({
	heroes,
	source,
	nested = false,
	legend = false,
}: {
	heroes: ChangedHero[];
	source?: NoteRef;
	nested?: boolean;
	legend?: boolean;
}) {
	if (nested && heroes.length === 0) return null;
	return (
		<>
			<SectionHeading
				as={nested ? "h3" : "h2"}
				count={heroes.length}
				source={source}
			>
				Hero changes
			</SectionHeading>
			{heroes.length === 0 ? (
				<EmptyState>No hero changes in this patch.</EmptyState>
			) : (
				<>
					{legend && <HeroLegend />}
					<div className="masonary">
						{heroes.map((changed) => (
							<ChangedHeroCard key={changed.hero.id} {...changed} />
						))}
					</div>
				</>
			)}
		</>
	);
}
