import AbilityPopover from "#/components/ability-popover";
import type { AbilityChange } from "#/types";
import { hasTierChanges } from "#/utils/abilityUpgrades";
import { useOpenAbility } from "./useOpenAbility";

/**
 * The row of ability icons on a hero card - shared by the changed-hero card
 * (icons carry a change dot, tiers show the diff) and the all-heroes page
 * (no dot, tiers show the hero's real upgrades with no patch in play).
 */
export default function AbilityRow({
	abilities,
}: {
	abilities: AbilityChange[];
}) {
	const {
		openAbility,
		toggleAbility,
		closeAbility,
		setAnchorRef,
		anchorRefFor,
	} = useOpenAbility();

	return (
		<ul className="flex list-none gap-2 p-2.5">
			{abilities.map(({ ability, changes, tiers }) => {
				const isOpen = openAbility === ability.class_name;
				return (
					<li key={ability.id}>
						<button
							ref={setAnchorRef(ability.class_name)}
							type="button"
							aria-expanded={isOpen}
							title={ability.name}
							onClick={() => toggleAbility(ability.class_name)}
							className={`relative block rounded p-0.5 ${isOpen ? "ring-2 ring-white" : "ring-1 ring-white/15"}`}
						>
							<img
								src={ability.image_webp ?? ability.image}
								alt={ability.name}
								width={44}
								height={44}
							/>
							{(changes.length > 0 || hasTierChanges(tiers)) && (
								<span className="absolute -top-1 -right-1 block size-2.5 rounded-full bg-amber-300">
									<span className="sr-only">Changed this patch</span>
								</span>
							)}
						</button>

						{isOpen && (
							<AbilityPopover
								ability={ability}
								changes={changes}
								tiers={tiers}
								anchorRef={anchorRefFor(ability.class_name)}
								onClose={closeAbility}
							/>
						)}
					</li>
				);
			})}
		</ul>
	);
}
