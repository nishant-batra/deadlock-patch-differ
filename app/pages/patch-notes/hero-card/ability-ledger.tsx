import TierRowView from "#/shared/components/ability-popover/tier-row";
import StatDelta from "#/shared/components/stat-delta";
import type { LedgerSection } from "./utils";

/**
 * Every number that moved on the hero's abilities, listed under the ability it
 * belongs to - the hero-card counterpart of an item card's change strip, so a
 * reader sees what changed without opening each ability's popover. Clicking a
 * block opens that ability's popover for the full upgrade detail.
 */
export default function AbilityLedger({
	sections,
	openAbility,
	onOpen,
}: {
	sections: LedgerSection[];
	openAbility: string | null;
	onOpen: (className: string) => void;
}) {
	if (sections.length === 0) return null;
	return (
		<div className="flex flex-col gap-1 px-1.5 pt-2">
			{sections.map(({ ability, rows, tierRows }) => (
				<section
					key={ability.id}
					className="relative flex flex-col gap-0.5 p-1 hover:bg-white/5"
				>
					<header className="flex items-center gap-2">
						<img
							src={ability.image_webp ?? ability.image}
							alt=""
							width={26}
							height={26}
							className="cut-double size-6.5 [--cut:var(--cut-xs)]"
						/>
						{/* Stretched over the whole block, so any row opens the popover
						    while the button itself stays the one accessible control. */}
						<button
							type="button"
							aria-expanded={openAbility === ability.class_name}
							onClick={() => onOpen(ability.class_name)}
							className="font-bold after:absolute after:inset-0"
						>
							{ability.name}
						</button>
					</header>
					<div className="pl-6">
						{rows.map((row) => (
							<StatDelta key={row.id} row={row} />
						))}
						{tierRows.length > 0 && (
							<div className="px-2 text-sm">
								{tierRows.map((row) => (
									<TierRowView key={row.key} row={row} />
								))}
							</div>
						)}
					</div>
				</section>
			))}
		</div>
	);
}
