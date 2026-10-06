import { describe, expect, it } from "vitest";
import type { AbilityChange, Change, Item, TierDiff } from "#/types";
import { abilityLedger, heroStatRows } from "./utils";

const change = (
	path: string[],
	old?: Change["old"],
	next?: Change["new"],
	kind: Change["kind"] = "modified",
): Change => ({ path, kind, old, new: next });

describe("heroStatRows", () => {
	it("merges hero and weapon moves with labels and direction", () => {
		const rows = heroStatRows(
			[
				change(["starting_stats", "max_health", "value"], 550, 600),
				change(
					[
						"standard_level_up_upgrades",
						"MODIFIER_VALUE_BASE_HEALTH_FROM_LEVEL",
					],
					30,
					32,
				),
			],
			[
				change(["weapon_info", "reload_duration"], 2.35, 2.5),
				change(["weapon_info", "clip_size"], undefined, 30, "added"),
			],
		);
		expect(
			rows.map(({ id, label, kind, negativeAttribute }) => [
				id,
				label,
				kind,
				negativeAttribute,
			]),
		).toEqual([
			["starting_stats.max_health.value", "Max Health", "stat", false],
			[
				"standard_level_up_upgrades.MODIFIER_VALUE_BASE_HEALTH_FROM_LEVEL",
				"Health / Level",
				"stat",
				false,
			],
			["weapon_info.reload_duration", "Reload Time", "stat", true],
			["weapon_info.clip_size", "Clip Size", "added", false],
		]);
		expect(rows[0]).toMatchObject({ old: 550, new: 600 });
	});
});

const ability = (name: string) =>
	({
		name,
		properties: { DotDamage: { value: "20", label: "Damage" } },
	}) as unknown as Item;

const tiers = (first: Partial<TierDiff> = {}): TierDiff[] => [
	{ tier: 1, rows: [], ...first },
	{ tier: 2, rows: [] },
	{ tier: 3, rows: [] },
];

const entry = (
	name: string,
	changes: Change[],
	tierDiffs = tiers(),
): AbilityChange => ({ ability: ability(name), changes, tiers: tierDiffs });

describe("abilityLedger", () => {
	const { sections, wording } = abilityLedger([
		entry(
			"Numbers",
			[change(["properties", "DotDamage", "value"], "15", "20")],
			tiers({
				rows: [
					{
						key: "BonusDamage",
						label: "Damage",
						kind: "changed",
						old: 10,
						new: 15,
					},
					{ key: "Range", label: "Range", kind: "equal", old: 5, new: 5 },
				],
			}),
		),
		entry("Reworded", [
			change(["tooltip_details", "info_sections", "0", "loc_string"], "a", "b"),
		]),
		entry("TierText", [], tiers({ text: { old: "a", new: "b" } })),
		entry(
			"TierRestated",
			[],
			tiers({
				rows: [
					{ key: "Cooldown", label: "Cooldown", kind: "removed", old: -20 },
				],
				text: {
					old: "-20s Cooldown and +1m Move Speed",
					new: "+1m Move Speed",
				},
			}),
		),
		entry("Other", [change(["activation"], "press", "instant_cast")]),
		entry("TierOnly", [change(["upgrades", "0", "property_upgrades"], [], [])]),
	]);

	it("spells out number moves, prefixing tier rows and skipping equal ones", () => {
		expect(sections.map(({ ability }) => ability.name)).toEqual([
			"Numbers",
			"TierRestated",
		]);
		const [{ ability, rows, tierRows }] = sections;
		expect(ability.name).toBe("Numbers");
		expect(rows.map(({ label }) => label)).toEqual(["Damage"]);
		expect(tierRows).toEqual([
			{
				key: "t1.BonusDamage",
				label: "T1 · Damage",
				kind: "changed",
				old: 10,
				new: 15,
			},
		]);
	});

	it("names abilities with wording or unrecognised changes, but not tier-only moves or tier text restating them", () => {
		expect(wording.map(({ ability }) => ability.name)).toEqual([
			"Reworded",
			"TierText",
			"Other",
		]);
	});
});
