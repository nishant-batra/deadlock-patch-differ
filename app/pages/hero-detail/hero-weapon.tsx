import StatRow from "#/shared/components/hero-stat-row";
import { weaponRows } from "#/shared/utils/heroDisplayRows";
import type { HeroWeapon as HeroWeaponData } from "#/types";

/**
 * The hero's gun - its name and the stats from its `weapon_info`. Bullet
 * damage and DPS live here rather than in `starting_stats`, which only covers
 * the body (health, movement, melee).
 */
export default function HeroWeapon({
	weapon: { name, weapon_info },
}: {
	weapon: HeroWeaponData;
}) {
	const rows = weaponRows(weapon_info);
	if (rows.length === 0) return null;

	return (
		<div className="rounded-md bg-[#1b1b24] py-1">
			<p className="px-2 py-1 font-bold text-amber-300 text-sm">{name}</p>
			<div className="flex flex-col gap-0.5">
				{rows.map(({ key, label, value }) => (
					<StatRow key={key} label={label} value={value} />
				))}
			</div>
		</div>
	);
}
