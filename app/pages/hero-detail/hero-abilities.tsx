import { AbilityDetail, TierBlock } from "#/shared/components/ability-popover";
import type { AbilityChange } from "#/types";

/**
 * The hero detail page's ability section - all 4 abilities with their upgrade
 * tiers always visible, no click needed. Reuses `TierBlock` and
 * `AbilityDetail` from `ability-popover/` directly (both are plain `<div>`s,
 * not tied to that folder's `createPortal` popover) rather than
 * `AbilityPopover` itself, which is click-to-open and portal-based - wrong
 * shape for a page where the content should already be on the page for
 * crawlers and readers alike.
 *
 * `changes` comes back empty for every ability here (`getAllHeroes()` joins
 * against an empty diff), so `AbilityDetail` renders the ability's real
 * tooltip/property detail with no diff noise - exactly what a "what does this
 * ability do" page needs.
 *
 * No separate description blurb under the heading: the description is the
 * first tooltip section's text, which `AbilityDetail` already renders.
 */
export default function HeroAbilities({
	abilities,
}: {
	abilities: AbilityChange[];
}) {
	return (
		<ul className="flex list-none flex-col gap-4">
			{abilities.map(({ ability, changes, tiers }) => (
				<li
					key={ability.id}
					className="rounded-md border border-white/10 bg-[#15151d] p-3"
				>
					<div className="flex items-center gap-3">
						<img
							src={ability.image_webp ?? ability.image}
							alt={ability.name}
							width={44}
							height={44}
							className="ability-icon-light rounded ring-1 ring-white/15"
						/>
						<p className="font-bold">{ability.name}</p>
					</div>

					<div className="mt-3">
						<AbilityDetail item={ability} changes={changes} />
					</div>

					<div className="mt-3 flex flex-col gap-1.5">
						{tiers.map((tier) => (
							<TierBlock key={tier.tier} tier={tier} />
						))}
					</div>
				</li>
			))}
		</ul>
	);
}
