import AbilityAllStats from "#/shared/components/ability-all-stats";
import AbilityCard from "#/shared/components/ability-card";
import type { AbilityChange } from "#/types";

/**
 * The hero detail page's ability section - every ability as its in-game card,
 * always on the page (for crawlers and readers alike) rather than behind the
 * patch notes' click-to-open popover. `changes` is empty here, so the cards
 * carry no diff marks; the full-width list is also the one place "All stats"
 * can expand without reflowing a masonry grid.
 */
export default function HeroAbilities({
	abilities,
}: {
	abilities: AbilityChange[];
}) {
	return (
		<ul className="flex list-none flex-col gap-4">
			{abilities.map(({ ability, changes, tiers }) => (
				<li key={ability.id}>
					<AbilityCard ability={ability} changes={changes} tiers={tiers}>
						<AbilityAllStats ability={ability} />
					</AbilityCard>
				</li>
			))}
		</ul>
	);
}
