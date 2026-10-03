import { describe, expect, it } from "vitest";
import type { WeaponInfo } from "#/types";
import { scalingRows, weaponRows } from "./heroDisplayRows";

// Haze's gun from the live catalog.
const HAZE_GUN: WeaponInfo = {
	bullet_damage: 5.26,
	bullets: 1,
	damage_per_second: 50.095238095238095,
	damage_per_second_with_reload: 25.167464114832537,
	shots_per_second: 9.523809523809524,
	burst_shot_count: 1,
	clip_size: 25,
	damage_per_magazine: 131.5,
	reload_duration: 2.35,
	crit_bonus_start: 1.65,
	damage_falloff_start_range: 787,
	damage_falloff_end_range: 1811,
};

const valuesOf = (info: WeaponInfo) =>
	Object.fromEntries(weaponRows(info).map(({ key, value }) => [key, value]));

describe("weaponRows", () => {
	it("formats a hero sheet in in-game order (Haze)", () => {
		expect(weaponRows(HAZE_GUN)).toEqual([
			{ key: "bullet_damage", label: "Bullet Damage", value: 5.26 },
			{ key: "damage_per_second", label: "DPS", value: 50.1 },
			{
				key: "damage_per_second_with_reload",
				label: "Sustained DPS (with reload)",
				value: 25.2,
			},
			{ key: "shots_per_second", label: "Fire Rate", value: "9.5 shots/s" },
			{ key: "clip_size", label: "Clip Size", value: 25 },
			{ key: "damage_per_magazine", label: "Damage / Magazine", value: 131.5 },
			{ key: "reload_duration", label: "Reload Time", value: "2.35s" },
			{ key: "crit_bonus_start", label: "Headshot Multiplier", value: "×1.65" },
			{ key: "damage_falloff", label: "Damage Falloff", value: "20m → 46m" },
		]);
	});

	it("spells out pellets and per-bullet reloads (Abrams' shotgun)", () => {
		const values = valuesOf({
			bullet_damage: 3.6,
			bullets: 9,
			reload_duration: 0.3525,
			reload_single_bullets: true,
		});
		expect(values.bullet_damage).toBe("3.6 × 9 pellets");
		expect(values.reload_duration).toBe("0.35s (per bullet)");
	});

	it("notes burst fire on the fire rate", () => {
		expect(
			valuesOf({ shots_per_second: 4, burst_shot_count: 3 }).shots_per_second,
		).toBe("4 shots/s (3-round bursts)");
	});

	it("skips rows whose source fields are missing", () => {
		expect(weaponRows({ clip_size: 25 })).toEqual([
			{ key: "clip_size", label: "Clip Size", value: 25 },
		]);
		// Falloff needs both ends.
		expect(valuesOf({ damage_falloff_start_range: 787 })).toEqual({});
	});
});

describe("scalingRows", () => {
	it("labels a mapped stat the way the rest of the page does (Haze's clip)", () => {
		expect(
			scalingRows({ EClipSize: { scaling_stat: "ETechPower", scale: 0.5 } }),
		).toEqual([
			{
				key: "EClipSize",
				label: "Clip Size",
				value: "+0.5 per Spirit Power",
				scalingStat: "ETechPower",
			},
		]);
	});

	it("humanises unmapped stats and sources", () => {
		const [row] = scalingRows({
			EFireRate: { scaling_stat: "EBoonCount", scale: 2 },
		});
		expect(row.label).toBe("Fire Rate");
		expect(row.value).toBe("+2 per BoonCount");
	});
});
