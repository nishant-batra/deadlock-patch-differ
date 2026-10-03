import type { Ref } from "react";
import AbilityRow from "#/shared/components/ability-row";
import HeroCard from "#/shared/components/hero-card";
import type { HeroEntry } from "#/types";

/**
 * A hero's roster card - the same ability row the patch-notes card uses
 * (tiers render the hero's real upgrades, with `equal` rows since nothing is
 * being diffed). Stats live on the hero page.
 */
export default function HeroProfileCard({
	hero,
	abilities,
	ref,
}: HeroEntry & {
	/** On the outer frame - the roster search scrolls to it. */
	ref?: Ref<HTMLSpanElement>;
}) {
	return (
		<HeroCard hero={hero} ref={ref} className="m-3 min-w-80 max-w-100">
			<HeroCard.Header hero={hero} />
			<AbilityRow abilities={abilities} />
		</HeroCard>
	);
}
