/** A hero's own stat, with no delta - the all-heroes page shows what a hero
 * has, not what changed. `StatDelta` doesn't apply here. */
export default function StatRow({
	label,
	value,
}: {
	label: string;
	value: number;
}) {
	return (
		<div className="flex items-baseline justify-between gap-2 px-2 py-1 text-sm">
			<span className="text-gray-300">{label}</span>
			<span className="font-bold text-gray-100">{value}</span>
		</div>
	);
}
