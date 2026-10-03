import StatRow from "#/shared/components/hero-stat-row";
import ScalingIcon from "#/shared/components/scaling-icon";
import { scalingRows } from "#/shared/utils/heroDisplayRows";
import type { HeroStatScaling } from "#/types";

/**
 * Base stats that grow with another stat - e.g. Haze's clip size rises with
 * Spirit Power. Easy to miss in game, since the hero sheet only shows the
 * current total. Renders nothing for the many heroes with no such stat.
 */
export default function HeroScaling({
	scalingStats,
}: {
	scalingStats?: Record<string, HeroStatScaling>;
}) {
	const rows = scalingRows(scalingStats ?? {});
	if (rows.length === 0) return null;

	return (
		<section className="mb-8">
			<h2 className="mb-2 font-bold text-xl">Stat Scaling</h2>
			<div className="flex flex-col gap-0.5 rounded-md bg-[#1b1b24] py-1">
				{rows.map(({ key, label, value, scalingStat }) => (
					<StatRow
						key={key}
						label={label}
						value={value}
						icon={<ScalingIcon filter={scalingStat} />}
					/>
				))}
			</div>
		</section>
	);
}
