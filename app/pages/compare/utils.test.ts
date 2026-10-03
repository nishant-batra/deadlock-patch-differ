import { describe, expect, it } from "vitest";
import type { CompareHero, Hero, WeaponInfo } from "#/types";
import { type CompareSection, compareSections } from "./utils";

type HeroFixture = {
	name: string;
	starting: Record<string, number>;
	levelUp?: Record<string, number>;
	extra?: Partial<Hero>;
	gun?: WeaponInfo;
};

const entry = ({
	name,
	starting,
	levelUp = {},
	extra,
	gun,
}: HeroFixture): CompareHero => ({
	hero: {
		name,
		starting_stats: Object.fromEntries(
			Object.entries(starting).map(([key, value]) => [key, { value }]),
		),
		standard_level_up_upgrades: levelUp,
		...extra,
	} as Hero,
	weapon: gun ? { name: `${name} gun`, weapon_info: gun } : undefined,
});

// Haze and Abrams, cut down to the stats the assertions read.
const HAZE = entry({
	name: "Haze",
	starting: { max_health: 550, stamina: 3, crit_damage_received_scale: 1 },
	levelUp: { MODIFIER_VALUE_BOON_COUNT: 0, MODIFIER_VALUE_TECH_POWER: 0 },
	extra: {
		tags: ["Assassin", "Stealthy", "Lethal"],
		gun_tag: "Rapid Fire",
		complexity: 1,
		scaling_stats: { EClipSize: { scaling_stat: "ETechPower", scale: 0.5 } },
	},
	gun: { clip_size: 25, reload_duration: 2.35 },
});

const ABRAMS = entry({
	name: "Abrams",
	starting: { max_health: 700, stamina: 3, crit_damage_received_scale: 0.8 },
	levelUp: { MODIFIER_VALUE_BOON_COUNT: 0, MODIFIER_VALUE_TECH_POWER: 10 },
	extra: { complexity: 2 },
	gun: { clip_size: 8, reload_duration: 0.3525, reload_single_bullets: true },
});

const section = (sections: CompareSection[], title: string) =>
	sections.find((candidate) => candidate.title === title);

const row = (sections: CompareSection[], title: string, key: string) =>
	section(sections, title)?.rows.find((candidate) => candidate.key === key);

describe("compareSections", () => {
	const sections = compareSections([HAZE, ABRAMS]);

	it("lists sections in display order", () => {
		expect(sections.map(({ title }) => title)).toEqual([
			"Profile",
			"Core stats",
			"Weapon",
			"Other stats",
			"Stat scaling",
			"Per level",
		]);
	});

	it("shows identity rows without highlighting", () => {
		expect(row(sections, "Profile", "tags")?.values).toEqual([
			"Assassin, Stealthy, Lethal",
			undefined,
		]);
		expect(row(sections, "Profile", "complexity")).toMatchObject({
			values: ["1 / 4", "2 / 4"],
			bestIndexes: [],
		});
	});

	it("highlights the higher value, or nothing on a tie", () => {
		expect(row(sections, "Core stats", "max_health")?.bestIndexes).toEqual([1]);
		expect(row(sections, "Core stats", "stamina")?.bestIndexes).toEqual([]);
	});

	it("highlights the lower value for higher-is-worse stats", () => {
		expect(
			row(sections, "Other stats", "crit_damage_received_scale"),
		).toMatchObject({
			label: "Crit Damage Taken",
			values: [1, 0.8],
			bestIndexes: [1],
		});
	});

	it("unions gun rows and leaves formatted text unhighlighted", () => {
		expect(row(sections, "Weapon", "clip_size")?.bestIndexes).toEqual([0]);
		expect(row(sections, "Weapon", "reload_duration")).toMatchObject({
			values: ["2.35s", "0.35s (per bullet)"],
			bestIndexes: [],
		});
	});

	it("leaves a gap where only one hero scales a stat", () => {
		expect(row(sections, "Stat scaling", "EClipSize")).toMatchObject({
			values: ["+0.5 per Spirit Power", undefined],
			bestIndexes: [],
		});
	});

	it("drops a level-up key only when every hero is at 0", () => {
		expect(
			section(sections, "Per level")?.rows.map(({ key, values }) => [
				key,
				values,
			]),
		).toEqual([["MODIFIER_VALUE_TECH_POWER", [0, 10]]]);
	});

	it("drops sections with no rows for the selection", () => {
		const titles = compareSections([ABRAMS]).map(({ title }) => title);
		expect(titles).not.toContain("Stat scaling");
		expect(
			compareSections([{ ...ABRAMS, weapon: undefined }]).map(
				({ title }) => title,
			),
		).not.toContain("Weapon");
	});
});
