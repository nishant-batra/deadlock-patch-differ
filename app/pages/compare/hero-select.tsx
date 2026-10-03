import CutFrame from "#/shared/components/cut-frame";
import { AMBER_BORDER } from "#/shared/components/cut-frame/constants";
import type { Hero } from "#/types";

/**
 * One compare slot. Options already picked in another slot are disabled so
 * the same hero can't occupy two columns at once. Only the closed box takes
 * the site's cut-corner frame - the open option list is drawn by the OS.
 */
export default function HeroSelect({
	index,
	heroes,
	value,
	taken,
	onChange,
}: {
	index: number;
	heroes: Hero[];
	value: string | null;
	taken: Set<string>;
	onChange: (classNameOrNull: string | null) => void;
}) {
	return (
		<CutFrame color={AMBER_BORDER}>
			<select
				aria-label={`Hero ${index + 1}`}
				value={value ?? ""}
				onChange={(event) => onChange(event.target.value || null)}
				className="cut-corner bg-[#1b1b24] py-2 pr-3 pl-2"
			>
				<option value="">Select a hero…</option>
				{heroes.map((hero) => (
					<option
						key={hero.class_name}
						value={hero.class_name}
						disabled={taken.has(hero.class_name)}
					>
						{hero.name}
					</option>
				))}
			</select>
		</CutFrame>
	);
}
