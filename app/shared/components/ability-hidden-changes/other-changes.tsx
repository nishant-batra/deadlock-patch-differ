import { humaniseStatKey } from "#/shared/utils/statLabels";
import type { Change } from "#/types";

const OTHER_LIMIT = 4;

/**
 * Everything that moved on an ability but is neither a stat nor copy.
 * Abilities still run on the raw payload diff, so this summarises the
 * remainder by name rather than spelling each one out.
 */
export default function OtherChanges({ changes }: { changes: Change[] }) {
	if (changes.length === 0) return null;
	const shown = changes.slice(0, OTHER_LIMIT);
	return (
		<div className="px-2 py-1 text-gray-400 text-xs">
			{shown.map(({ path, kind }) => (
				<span key={path.join(".")} className="mr-2 inline-block">
					{humaniseStatKey(path.at(-1) ?? "")}
					{kind !== "modified" ? ` (${kind})` : ""}
				</span>
			))}
			{changes.length > shown.length && (
				<span>+{changes.length - shown.length} more</span>
			)}
		</div>
	);
}
