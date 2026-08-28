import type { Hero } from "#/types";

/**
 * One compare slot. Options already picked in another slot are disabled so
 * the same hero can't occupy two columns at once.
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
		<select
			aria-label={`Hero ${index + 1}`}
			value={value ?? ""}
			onChange={(event) => onChange(event.target.value || null)}
			className="rounded-xl border border-amber-500 bg-[#1b1b24] p-2"
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
	);
}
