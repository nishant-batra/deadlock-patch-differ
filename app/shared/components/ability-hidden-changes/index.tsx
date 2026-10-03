import { splitAbilityChanges } from "#/shared/components/ability-card/utils";
import StatDelta from "#/shared/components/stat-delta";
import TextChange from "#/shared/components/text-change";
import type { Change, Item } from "#/types";
import OtherChanges from "./other-changes";

/**
 * The part of a patch the in-game card has no slot for: moves on properties
 * it never shows, copy from sections the patch removed, and anything that is
 * not a stat at all. Renders nothing when everything that moved is already
 * marked on the card.
 */
export default function AbilityHiddenChanges({
	ability,
	changes,
}: {
	ability: Item;
	changes: Change[];
}) {
	const {
		hidden: { rows, removedText, other },
	} = splitAbilityChanges(ability, changes);
	const count = rows.length + removedText.length + other.length;
	if (count === 0) return null;

	return (
		<div className="border border-[#4a4842] border-dashed bg-[#171716] py-2">
			<p className="flex items-baseline justify-between gap-2 px-2 pb-1 font-bold text-[#a8a397] text-[11px] uppercase tracking-widest">
				Not shown in-game
				<span className="text-[#f2c14e]">
					{count} {count === 1 ? "change" : "changes"}
				</span>
			</p>
			{rows.map((row) => (
				<StatDelta key={row.id} row={row} />
			))}
			{removedText.map(({ path, old, new: next }) => (
				<TextChange
					key={path.join(".")}
					before={String(old ?? "")}
					after={String(next ?? "")}
				/>
			))}
			<OtherChanges changes={other} />
		</div>
	);
}
