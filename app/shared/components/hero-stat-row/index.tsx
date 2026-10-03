/** A hero's own stat, with no delta - the hero page shows what a hero has,
 * not what changed. `StatDelta` doesn't apply here. */
export default function StatRow({
	label,
	value,
	icon,
}: {
	label: string;
	value: number | string;
	/** Drawn after the value, e.g. the scaling stat's icon. */
	icon?: React.ReactNode;
}) {
	return (
		<div className="flex items-baseline justify-between gap-2 px-2 py-1 text-sm">
			<span className="text-gray-300">{label}</span>
			<span className="font-bold text-gray-100">
				{value}
				{icon}
			</span>
		</div>
	);
}
