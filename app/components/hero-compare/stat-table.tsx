import HeroAvatar from "#/components/hero-avatar";
import type { Hero } from "#/types";
import { compareSections } from "./utils";

/**
 * Every stat heading for the current selection, one column per hero. A plain
 * prop-driven table - as `heroes` grows from 1 to 3, `heroes.map` adds a
 * column on the next render, nothing else to wire up.
 */
export default function StatTable({ heroes }: { heroes: Hero[] }) {
	return (
		<div className="overflow-x-auto rounded-md bg-[#1b1b24]">
			<table className="w-full min-w-[480px] border-collapse text-sm">
				<thead>
					<tr className="bg-[#2a2a36]">
						<th className="p-2.5 text-left font-normal" />
						{heroes.map((hero) => (
							<th key={hero.class_name} className="p-2.5 text-left">
								<div className="flex items-center gap-2">
									<HeroAvatar hero={hero} size={32} />
									<span className="font-bold">{hero.name}</span>
								</div>
							</th>
						))}
					</tr>
				</thead>
				{compareSections(heroes).map((section) => (
					<tbody key={section.title}>
						<tr>
							<th
								colSpan={heroes.length + 1}
								className="bg-[#22222c] px-2 py-1 text-left font-bold text-[10px] text-gray-400 uppercase tracking-widest"
							>
								{section.title}
							</th>
						</tr>
						{section.rows.map((row) => (
							<tr key={row.key} className="border-white/5 border-t">
								<td className="px-2 py-1 text-gray-400">{row.label}</td>
								{row.values.map((value, index) => (
									<td
										key={heroes[index]?.class_name ?? index}
										className={
											row.bestIndexes.includes(index)
												? "px-2 py-1 font-bold text-amber-300"
												: "px-2 py-1"
										}
									>
										{value ?? "—"}
									</td>
								))}
							</tr>
						))}
					</tbody>
				))}
			</table>
		</div>
	);
}
