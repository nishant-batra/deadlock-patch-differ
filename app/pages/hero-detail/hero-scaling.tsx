import ScalingIcon from "#/shared/components/ability-popover/scaling-icon";
import type { HeroStatScaling } from "#/types";
import { scalingRows } from "./utils";

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
				{rows.map(({ key, label, scale, scalingStat, sourceLabel }) => (
					<div
						key={key}
						className="flex items-baseline justify-between gap-2 px-2 py-1 text-sm"
					>
						<span className="text-gray-300">{label}</span>
						<span className="font-bold text-gray-100">
							+{scale} per {sourceLabel}
							<ScalingIcon filter={scalingStat} />
						</span>
					</div>
				))}
			</div>
		</section>
	);
}
