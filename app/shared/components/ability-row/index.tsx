import { hasTierChanges } from "#/lib/abilityUpgrades";
import AbilityPopover from "#/shared/components/ability-popover";
import CutFrame from "#/shared/components/cut-frame";
import type { AbilityChange } from "#/types";
import { CHANGED_COLOR, UNCHANGED_COLOR } from "./constants";
import { useOpenAbility } from "./useOpenAbility";

/**
 * The row of ability icons on a hero card - shared by the changed-hero card
 * (changed icons get an amber frame, tiers show the diff) and the all-heroes
 * page (every frame is neutral, tiers show the hero's real upgrades with no
 * patch in play).
 */
export default function AbilityRow({
	abilities,
	openState,
}: {
	abilities: AbilityChange[];
	/** Pass when something outside the row (the changed-hero card's change
	 * list) also needs to open these popovers; otherwise the row owns it. */
	openState?: ReturnType<typeof useOpenAbility>;
}) {
	const ownState = useOpenAbility();
	const {
		openAbility,
		toggleAbility,
		closeAbility,
		setAnchorRef,
		anchorRefFor,
	} = openState ?? ownState;

	return (
		<ul className="flex list-none gap-2 p-2.5">
			{abilities.map(({ ability, changes, tiers }) => {
				const isOpen = openAbility === ability.class_name;
				const isChanged = changes.length > 0 || hasTierChanges(tiers);
				return (
					<li key={ability.id}>
						<button
							ref={setAnchorRef(ability.class_name)}
							type="button"
							aria-expanded={isOpen}
							title={ability.name}
							onClick={() => toggleAbility(ability.class_name)}
							className="block"
						>
							<CutFrame
								cut="sm"
								width={isOpen ? 2 : 1}
								color={isChanged ? CHANGED_COLOR : UNCHANGED_COLOR}
								className="flex size-12"
							>
								<img
									src={ability.image_webp ?? ability.image}
									alt={ability.name}
									width={44}
									height={44}
									className="cut-double size-full"
								/>
							</CutFrame>
							{isChanged && <span className="sr-only">Changed this patch</span>}
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
