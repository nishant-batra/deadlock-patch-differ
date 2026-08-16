import { scalingIcon } from "#/utils/scaling";

/**
 * Marks a tier row's bonus as scaling with a stat (spirit/weapon/melee/boon)
 * rather than being flat. Falls back to the old `✦` glyph with the raw
 * `scale_stat_filter` in its title when the filter isn't one of the four
 * known scaling types - only `ETechPower` (spirit) is confirmed in the
 * current catalog, so the fallback is the common case for anything new.
 */
export default function ScalingIcon({ filter }: { filter: string }) {
	const icon = scalingIcon(filter);
	if (!icon) {
		return (
			<span className="ml-1 text-[10px] text-violet-300" title={filter}>
				✦
			</span>
		);
	}
	return (
		<img
			src={icon.src}
			alt={icon.label}
			title={icon.label}
			width={14}
			height={14}
			className="ml-1 inline-block align-text-bottom"
		/>
	);
}
