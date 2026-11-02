import clsx from "clsx";
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

	// The popover's prev/next arrows step through changed abilities only; an
	// arrow is dropped at either end, and an unchanged open ability gets none.
	const changedIndexes = abilities.flatMap(({ changes, tiers }, index) =>
		changes.length > 0 || hasTierChanges(tiers) ? [index] : [],
	);
	const position =
		openAbility === null ? -1 : changedIndexes.indexOf(openAbility);
	const prev = position > 0 ? changedIndexes[position - 1] : undefined;
	const next = position >= 0 ? changedIndexes[position + 1] : undefined;

	return (
		<ul className="flex list-none gap-2 p-2.5">
			{abilities.map(({ ability, changes, tiers }, index) => {
				const isOpen = openAbility === index;
				const isChanged = changes.length > 0 || hasTierChanges(tiers);
				return (
					<li key={ability.id}>
						<button
							ref={setAnchorRef(index)}
							type="button"
							aria-expanded={isOpen}
							title={ability.name}
							onClick={() => toggleAbility(index)}
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
									loading="lazy"
									className={clsx(
										"cut-double ability-icon-light size-full",
										isChanged && "ability-icon-changed",
									)}
								/>
							</CutFrame>
							{isChanged && <span className="sr-only">Changed this patch</span>}
						</button>

						{isOpen && (
							<AbilityPopover
								ability={ability}
								changes={changes}
								tiers={tiers}
								anchorRef={anchorRefFor(index)}
								onClose={closeAbility}
								onPrev={
									prev === undefined ? undefined : () => toggleAbility(prev)
								}
								onNext={
									next === undefined ? undefined : () => toggleAbility(next)
								}
							/>
						)}
					</li>
				);
			})}
		</ul>
	);
}
