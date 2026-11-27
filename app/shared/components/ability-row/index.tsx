import clsx from "clsx";
import AbilityPopover from "#/shared/components/ability-popover";
import CutFrame from "#/shared/components/cut-frame";
import type { AbilityChange } from "#/types";
import { CHANGED_COLOR, UNCHANGED_COLOR } from "./constants";
import Marker from "./marker";
import type { OpenState } from "./types";
import { useAnchorRefs } from "./useAnchorRefs";
import { useHoverPreview } from "./useHoverPreview";
import { useOpenAbility } from "./useOpenAbility";
import { isAbilityChanged } from "./utils";

export type { OpenState } from "./types";

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
	/** Pass when something outside the row (the patch-notes hero list) owns
	 * which popover is open; otherwise the row owns it. */
	openState?: OpenState;
}) {
	const ownState = useOpenAbility();
	const state = openState ?? ownState;
	const { openAbility, preview, status, close, onClosed, nav } = state;
	const { setAnchorRef: setOwnAnchorRef, anchorRefFor } = useAnchorRefs();
	// An owner that registers anchors renders the popover itself.
	const ownsPopover = !state.setAnchorRef;
	const setAnchorRef = state.setAnchorRef ?? setOwnAnchorRef;
	const { hoverProps, iconProps } = useHoverPreview(state);

	return (
		<ul className="flex list-none gap-2 p-2.5">
			{abilities.map((abilityChange, index) => {
				const { ability, changes, tiers } = abilityChange;
				const isOpen = openAbility === index;
				const isChanged = isAbilityChanged(abilityChange);
				return (
					<li key={ability.id} {...hoverProps(index)}>
						<button
							ref={setAnchorRef(index)}
							type="button"
							aria-expanded={isOpen}
							title={ability.name}
							{...iconProps(index)}
							// The popover scrolls this into view: clear the navbar and any sticky section bar.
							className="block scroll-mt-[calc(var(--nav-height)+var(--sticky-bar-height,0px)+0.5rem)]"
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
						{isChanged && <Marker abilityChange={abilityChange} />}

						{ownsPopover && isOpen && (
							<AbilityPopover
								ability={ability}
								changes={changes}
								tiers={tiers}
								anchorRef={anchorRefFor(index)}
								anchorKey={index}
								onClose={close}
								closing={status === "closing"}
								onClosed={onClosed}
								nav={nav}
								preview={preview}
							/>
						)}
					</li>
				);
			})}
		</ul>
	);
}
