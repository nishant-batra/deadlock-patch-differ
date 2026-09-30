import { describe, expect, it } from "vitest";
import type { Hero, Item } from "#/types";
import type { TierDiff } from "./abilityUpgrades";
import { buildHeroChanges } from "./heroChanges";

// Fixtures are the smallest shapes buildHeroChanges reads. Each hero owns one
// weapon and four abilities, named after the hero so heroes never share them.

const SLOTS = ["signature1", "signature2", "signature3", "signature4"];

type HeroOverrides = {
	starting?: Record<string, number>;
	levelUp?: Record<string, number>;
	extra?: Record<string, unknown>;
	live?: boolean;
};

const hero = (name: string, overrides: HeroOverrides = {}): Hero =>
	({
		name,
		player_selectable: overrides.live ?? true,
		disabled: false,
		in_development: false,
		items: {
			weapon_primary: `${name}_weapon`,
			...Object.fromEntries(SLOTS.map((slot) => [slot, `${name}_${slot}`])),
		},
		starting_stats: Object.fromEntries(
			Object.entries(overrides.starting ?? { max_health: 800 }).map(
				([stat, value]) => [stat, { value, display_stat_name: stat }],
			),
		),
		standard_level_up_upgrades: overrides.levelUp ?? {},
		...overrides.extra,
	}) as unknown as Hero;

const weapon = (heroName: string, info: Record<string, unknown>): Item =>
	({
		class_name: `${heroName}_weapon`,
		name: `${heroName}_weapon`,
		weapon_info: info,
		properties: {},
	}) as unknown as Item;

type AbilityOverrides = {
	properties?: Record<string, { value: string | number; stat_scale?: number }>;
	desc?: string;
};

const ability = (
	heroName: string,
	slot: string,
	overrides: AbilityOverrides = {},
): Item =>
	({
		class_name: `${heroName}_${slot}`,
		name: `${heroName} ${slot}`,
		properties: Object.fromEntries(
			Object.entries(overrides.properties ?? {}).map(
				([key, { value, stat_scale }]) => [
					key,
					stat_scale === undefined
						? { value }
						: { value, scale_function: { stat_scale } },
				],
			),
		),
		description: { desc: overrides.desc ?? "Does a thing." },
	}) as unknown as Item;

/** One hero's full item set: weapon plus four default abilities, overridable. */
const kit = (
	heroName: string,
	weaponInfo: Record<string, unknown> = { bullet_damage: 5 },
	abilityOverrides: Record<string, AbilityOverrides> = {},
): Item[] => [
	weapon(heroName, weaponInfo),
	...SLOTS.map((slot) => ability(heroName, slot, abilityOverrides[slot])),
];

const build = (
	before: { heroes: Hero[]; items: Item[] },
	after: { heroes: Hero[]; items: Item[] },
	tiers: Record<string, TierDiff[]> = {},
) =>
	buildHeroChanges(
		before.heroes,
		after.heroes,
		before.items,
		after.items,
		tiers,
	);

describe("buildHeroChanges - hero stats", () => {
	it("reports nothing when nothing changed", () => {
		const state = { heroes: [hero("A")], items: kit("A") };
		expect(build(state, state)).toEqual({});
	});

	it("reports a starting stat change", () => {
		const result = build(
			{
				heroes: [hero("A", { starting: { max_health: 800 } })],
				items: kit("A"),
			},
			{
				heroes: [hero("A", { starting: { max_health: 850 } })],
				items: kit("A"),
			},
		);
		expect(result.A.stats).toEqual([
			{
				path: ["starting_stats", "max_health", "value"],
				kind: "modified",
				old: 800,
				new: 850,
			},
		]);
	});

	it("reports a per-level stat change", () => {
		const result = build(
			{
				heroes: [hero("A", { levelUp: { MODIFIER_VALUE_TECH_POWER: 1.1 } })],
				items: kit("A"),
			},
			{
				heroes: [hero("A", { levelUp: { MODIFIER_VALUE_TECH_POWER: 1.3 } })],
				items: kit("A"),
			},
		);
		expect(result.A.stats).toEqual([
			expect.objectContaining({
				path: ["standard_level_up_upgrades", "MODIFIER_VALUE_TECH_POWER"],
				old: 1.1,
				new: 1.3,
			}),
		]);
	});

	it("ignores fields outside the allowlist (gender, search_name, purchase_bonuses, images)", () => {
		const result = build(
			{
				heroes: [
					hero("A", {
						extra: {
							purchase_bonuses: { weapon: [1] },
							images: { name_image: "a.svg" },
						},
					}),
				],
				items: kit("A"),
			},
			{
				heroes: [
					hero("A", {
						extra: {
							gender: "male",
							search_name: "A",
							popular_items: { early_game: [] },
							images: { name_image: "heroes/a.svg" },
						},
					}),
				],
				items: kit("A"),
			},
		);
		expect(result).toEqual({});
	});

	it("stays silent when the API starts reporting a stat for every hero (ooc_health_regen)", () => {
		const before = {
			heroes: [hero("A"), hero("B")],
			items: [...kit("A"), ...kit("B")],
		};
		const after = {
			heroes: [
				hero("A", { starting: { max_health: 800, ooc_health_regen: 3 } }),
				hero("B", { starting: { max_health: 800, ooc_health_regen: 3 } }),
			],
			items: before.items,
		};
		expect(build(before, after)).toEqual({});
	});

	it("reports NEW when one hero gains a stat others already had", () => {
		const before = {
			heroes: [
				hero("A"),
				hero("B", { starting: { max_health: 800, stamina: 3 } }),
			],
			items: [...kit("A"), ...kit("B")],
		};
		const after = {
			heroes: [
				hero("A", { starting: { max_health: 800, stamina: 2 } }),
				hero("B", { starting: { max_health: 800, stamina: 3 } }),
			],
			items: before.items,
		};
		expect(build(before, after).A.stats).toEqual([
			{ path: ["starting_stats", "stamina", "value"], kind: "added", new: 2 },
		]);
	});

	it("reports REMOVED when one hero loses a stat others still have", () => {
		const before = {
			heroes: [
				hero("A", { starting: { max_health: 800, stamina: 2 } }),
				hero("B", { starting: { max_health: 800, stamina: 3 } }),
			],
			items: [...kit("A"), ...kit("B")],
		};
		const after = {
			heroes: [
				hero("A"),
				hero("B", { starting: { max_health: 800, stamina: 3 } }),
			],
			items: before.items,
		};
		expect(build(before, after).A.stats).toEqual([
			{ path: ["starting_stats", "stamina", "value"], kind: "removed", old: 2 },
		]);
	});

	it("stays silent when the API stops reporting a stat for everyone", () => {
		const before = {
			heroes: [
				hero("A", { starting: { max_health: 800, stamina: 2 } }),
				hero("B", { starting: { max_health: 800, stamina: 3 } }),
			],
			items: [...kit("A"), ...kit("B")],
		};
		const after = { heroes: [hero("A"), hero("B")], items: before.items };
		expect(build(before, after)).toEqual({});
	});

	it("reports a move to 0 as a change, not a removal", () => {
		const result = build(
			{
				heroes: [hero("A", { starting: { max_health: 800, stamina: 2 } })],
				items: kit("A"),
			},
			{
				heroes: [hero("A", { starting: { max_health: 800, stamina: 0 } })],
				items: kit("A"),
			},
		);
		expect(result.A.stats).toEqual([
			expect.objectContaining({ kind: "modified", old: 2, new: 0 }),
		]);
	});
});

describe("buildHeroChanges - weapon", () => {
	const weaponChange = (
		before: Record<string, unknown>,
		after: Record<string, unknown>,
	) =>
		build(
			{ heroes: [hero("A")], items: kit("A", before) },
			{ heroes: [hero("A")], items: kit("A", after) },
		).A?.weapon;

	it("reports spread and other newly exposed fields once they move", () => {
		expect(weaponChange({ spread: 0.05 }, { spread: 0.04 })).toEqual([
			{
				path: ["weapon_info", "spread"],
				kind: "modified",
				old: 0.05,
				new: 0.04,
			},
		]);
	});

	it("flattens recoil to its range", () => {
		expect(
			weaponChange(
				{ vertical_recoil: { range: [0.2, 0.2], burst_exponent: 1 } },
				{ vertical_recoil: { range: [0.2, 0.3], burst_exponent: 2 } },
			),
		).toEqual([
			{
				path: ["weapon_info", "vertical_recoil"],
				kind: "modified",
				old: "0.2 / 0.2",
				new: "0.2 / 0.3",
			},
		]);
	});

	it("ignores recoil tuning numbers when the range is unchanged", () => {
		expect(
			weaponChange(
				{ vertical_recoil: { range: [0, 0], burst_exponent: 1 } },
				{ vertical_recoil: { range: [0, 0], burst_exponent: 2 } },
			),
		).toBeUndefined();
	});

	it("flattens numeric arrays", () => {
		expect(
			weaponChange(
				{ aiming_shot_spread_penalty: [0, 0.75] },
				{ aiming_shot_spread_penalty: [0, 0.5] },
			),
		).toEqual([expect.objectContaining({ old: "0 / 0.75", new: "0 / 0.5" })]);
	});

	it("ignores the recoil seed and derived damage fields", () => {
		expect(
			weaponChange(
				{ recoil_seed: 755, damage_per_shot: 5, damage_per_magazine: 150 },
				{ recoil_seed: 9812, damage_per_shot: 6, damage_per_magazine: 180 },
			),
		).toBeUndefined();
	});

	it("ignores non-numeric fields", () => {
		expect(
			weaponChange(
				{ can_zoom: true, bullet_handler_type: "A" },
				{ can_zoom: false, bullet_handler_type: "B" },
			),
		).toBeUndefined();
	});

	it("stays silent for fields every weapon gained at once (zoom_fov)", () => {
		expect(
			weaponChange({ bullet_damage: 5 }, { bullet_damage: 5, zoom_fov: 35 }),
		).toBeUndefined();
	});
});

describe("buildHeroChanges - abilities", () => {
	const abilityChanges = (before: AbilityOverrides, after: AbilityOverrides) =>
		build(
			{
				heroes: [hero("A")],
				items: kit("A", undefined, { signature1: before }),
			},
			{
				heroes: [hero("A")],
				items: kit("A", undefined, { signature1: after }),
			},
		).A?.abilities["A signature1"];

	it("reports a property value change (Telekinesis)", () => {
		expect(
			abilityChanges(
				{ properties: { AbilityChannelTime: { value: "0.65" } } },
				{ properties: { AbilityChannelTime: { value: "1.25" } } },
			),
		).toEqual([
			{
				path: ["properties", "AbilityChannelTime", "value"],
				kind: "modified",
				old: "0.65",
				new: "1.25",
			},
		]);
	});

	it("reports a scaling change", () => {
		expect(
			abilityChanges(
				{ properties: { Damage: { value: "100", stat_scale: 0.2 } } },
				{ properties: { Damage: { value: "100", stat_scale: 0.3 } } },
			),
		).toEqual([
			expect.objectContaining({
				path: ["properties", "Damage", "scale_function", "stat_scale"],
				old: 0.2,
				new: 0.3,
			}),
		]);
	});

	it("ignores a unit-suffixed zero moving between keys (Sleep Dagger)", () => {
		expect(
			abilityChanges(
				{
					properties: {
						RicochetRadius: { value: "0m" },
						ExplosionRadius: { value: "0m" },
					},
				},
				{ properties: { ExplosionRadius: { value: "0m" } } },
			),
		).toBeUndefined();
	});

	it("ignores casing-only and markup-only description edits", () => {
		expect(
			abilityChanges(
				{ desc: "Deals <b>Spirit Damage</b>." },
				{ desc: "Deals spirit damage." },
			),
		).toBeUndefined();
	});

	it("reports a real description rewrite (Time Wall lost its silence)", () => {
		expect(
			abilityChanges(
				{ desc: "Enemies are slowed and silenced." },
				{ desc: "Enemies are slowed." },
			),
		).toEqual([
			expect.objectContaining({ path: ["description"], kind: "modified" }),
		]);
	});

	it("flags a hero whose only change is an upgrade tier", () => {
		const state = { heroes: [hero("A")], items: kit("A") };
		const tiers: Record<string, TierDiff[]> = {
			"A signature2": [
				{
					tier: 1,
					rows: [
						{
							key: "Damage|#0",
							label: "Damage",
							kind: "changed",
							old: 50,
							new: 85,
						},
					],
				},
			] as TierDiff[],
		};
		expect(build(state, state, tiers)).toEqual({
			A: { stats: [], weapon: [], abilities: {} },
		});
	});

	it("does not flag a hero whose tiers are all unchanged", () => {
		const state = { heroes: [hero("A")], items: kit("A") };
		const tiers: Record<string, TierDiff[]> = {
			"A signature2": [
				{
					tier: 1,
					rows: [{ key: "Damage|#0", label: "Damage", kind: "equal", new: 50 }],
				},
			] as TierDiff[],
		};
		expect(build(state, state, tiers)).toEqual({});
	});
});

describe("buildHeroChanges - which heroes qualify", () => {
	const changed = (name: string, overrides: HeroOverrides = {}) => ({
		before: hero(name, { ...overrides, starting: { max_health: 800 } }),
		after: hero(name, { ...overrides, starting: { max_health: 900 } }),
	});

	it("skips heroes that are not live", () => {
		const { before, after } = changed("A", { live: false });
		expect(
			build(
				{ heroes: [before], items: kit("A") },
				{ heroes: [after], items: kit("A") },
			),
		).toEqual({});
	});

	it("skips heroes with no previous baseline", () => {
		expect(
			build(
				{ heroes: [], items: [] },
				{ heroes: [hero("A")], items: kit("A") },
			),
		).toEqual({});
	});

	it("skips heroes whose ability slots do not resolve", () => {
		const { before, after } = changed("A");
		const items = kit("A").filter((item) => item.class_name !== "A_signature4");
		expect(
			build({ heroes: [before], items }, { heroes: [after], items }),
		).toEqual({});
	});
});
