import clsx from "clsx";
import PropertyValue from "#/shared/components/property-value";
import type { Item } from "#/types";
import { allStatRows } from "./utils";

/** Label colours - shared by the rows and the legend so the two can't drift. */
const NAMED = "text-[#d6d1c6]";
const UNNAMED = "text-gray-500";

/**
 * The API's values the in-game card leaves out, collapsed by default. Only for
 * full-width layouts like the hero page: opening it changes the card's height,
 * which reflows a masonry grid.
 */
export default function AbilityAllStats({ ability }: { ability: Item }) {
	const rows = allStatRows(ability);
	if (rows.length === 0) return null;
	return (
		<details className="group border border-[#3a3935] bg-[#171716]">
			<summary className="flex items-center justify-between gap-2 px-3 py-2 font-bold text-[#a8a397] text-[11px] uppercase tracking-widest">
				<span>All stats · {rows.length} values not on the in-game card</span>
				<span className="transition-transform group-open:rotate-90">›</span>
			</summary>
			{/* Only needed when some labels are greyed - otherwise there's no
			    difference to explain. */}
			{rows.some(({ labelled }) => !labelled) && (
				<ul className="flex flex-col gap-0.5 border-[#3a3935] border-t px-3 pt-2 text-xs">
					<li className={NAMED}>
						● Named by the game, as shown in its own tooltips
					</li>
					<li className={UNNAMED}>
						● No in-game name, label made from the internal key
					</li>
				</ul>
			)}
			<dl className="grid grid-cols-1 gap-x-6 border-[#3a3935] border-t px-3 py-2 text-[13px] sm:grid-cols-2">
				{rows.map(({ key, property, label, labelled }) => (
					<div
						key={key}
						title={key}
						className="flex items-baseline justify-between gap-3 py-0.5"
					>
						<dt
							className={clsx(
								"min-w-0 [overflow-wrap:anywhere]",
								labelled ? NAMED : UNNAMED,
							)}
						>
							{label}
						</dt>
						<dd className="font-bold text-[#f4efe4]">
							<PropertyValue property={property} />
						</dd>
					</div>
				))}
			</dl>
		</details>
	);
}
