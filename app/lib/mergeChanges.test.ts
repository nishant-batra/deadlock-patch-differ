import { describe, expect, it } from "vitest";
import type { DisplayChange, HeroChanges, Item } from "#/types";
import type { TierDiff, TierRow } from "./abilityUpgrades";
import type { Change } from "./diffEngine";
import {
	mergeAbilityTiers,
	mergeChangeLists,
	mergeDisplayChanges,
	mergeHeroChanges,
	mergeItemChanges,
	nextHotfix,
	readHotfix,
	type StoredItemChanges,
	tagHotfix,
} from "./mergeChanges";

const PATH = ["properties", "Damage", "value"];
const modified = (old: number, value: number, path = PATH): Change => ({
	path,
	kind: "modified",
	old,
	new: value,
});
const added = (value: number, path = PATH): Change => ({
	path,
	kind: "added",
	new: value,
});
const removed = (old: number, path = PATH): Change => ({
	path,
	kind: "removed",
	old,
});

describe("mergeChangeLists - the composition table", () => {
	it("adds a change the page did not have", () => {
		expect(mergeChangeLists([], [modified(10, 8)])).toEqual([modified(10, 8)]);
	});

	it("keeps a change the hotfix did not touch", () => {
		expect(mergeChangeLists([modified(10, 8)], [])).toEqual([modified(10, 8)]);
	});

	it("collapses a second tweak into one row from the original value", () => {
		expect(mergeChangeLists([modified(10, 8)], [modified(8, 9)])).toEqual([
			modified(10, 9),
		]);
	});

	it("drops a change the hotfix reverted", () => {
		expect(mergeChangeLists([modified(10, 8)], [modified(8, 10)])).toEqual([]);
	});

	it("keeps a new stat new, at its latest value", () => {
		expect(mergeChangeLists([added(5)], [modified(5, 6)])).toEqual([added(6)]);
	});

	it("drops a stat added then removed", () => {
		expect(mergeChangeLists([added(5)], [removed(5)])).toEqual([]);
	});

	it("drops a stat removed then restored", () => {
		expect(mergeChangeLists([removed(5)], [added(5)])).toEqual([]);
	});

	it("turns a stat removed then restored at another value into a change", () => {
		expect(mergeChangeLists([removed(5)], [added(7)])).toEqual([
			modified(5, 7),
		]);
	});

	it("treats 0 and missing as the same nothing", () => {
		expect(mergeChangeLists([modified(0, 5)], [removed(5)])).toEqual([]);
	});

	it("keeps page order and appends the hotfix's new changes", () => {
		const other = ["starting_stats", "max_health", "value"];
		expect(
			mergeChangeLists(
				[modified(1, 2, other), modified(10, 8)],
				[modified(8, 9), modified(3, 4, ["x"])],
			),
		).toEqual([modified(1, 2, other), modified(10, 9), modified(3, 4, ["x"])]);
	});

	it("drops a description rewrite that was reverted up to markup and casing", () => {
		const description = (old: string, value: string): Change => ({
			path: ["description"],
			kind: "modified",
			old,
			new: value,
		});
		expect(
			mergeChangeLists(
				[description("Stuns <b>enemies</b>", "Slows enemies")],
				[description("Slows enemies", "stuns enemies")],
			),
		).toEqual([]);
	});
});

describe("mergeDisplayChanges", () => {
	const stat = (old: string, value: string): DisplayChange => ({
		kind: "stat",
		section: "innate",
		key: "BonusHealth",
		label: "Bonus Health",
		old,
		new: value,
	});

	it("composes stat rows", () => {
		expect(
			mergeDisplayChanges([stat("100", "75")], [stat("75", "90")]),
		).toEqual([stat("100", "90")]);
	});

	it("turns a row removed then re-added at a new value into a stat change", () => {
		expect(
			mergeDisplayChanges(
				[
					{
						kind: "row-removed",
						section: "innate",
						key: "BonusHealth",
						label: "Bonus Health",
						value: "100",
					},
				],
				[
					{
						kind: "row-added",
						section: "innate",
						key: "BonusHealth",
						label: "Bonus Health",
						value: "90",
					},
				],
			),
		).toEqual([stat("100", "90")]);
	});

	it("drops a row added then removed", () => {
		expect(
			mergeDisplayChanges(
				[
					{
						kind: "row-added",
						section: "active",
						key: "Radius",
						label: "Radius",
						value: "8m",
					},
				],
				[
					{
						kind: "row-removed",
						section: "active",
						key: "Radius",
						label: "Radius",
						value: "8m",
					},
				],
			),
		).toEqual([]);
	});

	it("composes cost, cooldown and components", () => {
		expect(
			mergeDisplayChanges(
				[
					{ kind: "cost", old: 800, new: 1250 },
					{ kind: "cooldown", section: "active", old: 30, new: 25 },
					{ kind: "components", old: ["A"], new: ["B"] },
				],
				[
					{ kind: "cost", old: 1250, new: 800 },
					{ kind: "cooldown", section: "active", old: 25, new: 20 },
					{ kind: "components", old: ["B"], new: ["C"] },
				],
			),
		).toEqual([
			{ kind: "cooldown", section: "active", old: 30, new: 20 },
			{ kind: "components", old: ["A"], new: ["C"] },
		]);
	});
});

describe("mergeItemChanges", () => {
	const item = (name: string, bonus: string): Item =>
		({
			name,
			properties: { BonusHealth: { value: bonus, label: "Bonus Health" } },
			tooltip_sections: [
				{
					section_type: "innate",
					section_attributes: [{ properties: ["BonusHealth"] }],
				},
			],
		}) as unknown as Item;
	const stat = (old: string, value: string): DisplayChange => ({
		kind: "stat",
		section: "innate",
		key: "BonusHealth",
		label: "Bonus Health",
		old,
		new: value,
	});
	const changes = (
		partial: Partial<StoredItemChanges> = {},
	): StoredItemChanges => ({ added: [], removed: [], changed: [], ...partial });

	it("drops an item added then removed within the window", () => {
		expect(
			mergeItemChanges(
				changes({ added: [{ name: "Shiv" }] }),
				changes({ removed: [{ name: "Shiv", snapshot: item("Shiv", "1") }] }),
				new Map(),
			),
		).toEqual(changes());
	});

	it("keeps an added item added when the hotfix tweaks it", () => {
		expect(
			mergeItemChanges(
				changes({ added: [{ name: "Shiv" }] }),
				changes({ changed: [{ name: "Shiv", changes: [stat("1", "2")] }] }),
				new Map(),
			),
		).toEqual(changes({ added: [{ name: "Shiv" }] }));
	});

	it("diffs a restored item against the snapshot it was removed with", () => {
		const current = item("Shiv", "150");
		expect(
			mergeItemChanges(
				changes({ removed: [{ name: "Shiv", snapshot: item("Shiv", "100") }] }),
				changes({ added: [{ name: "Shiv" }] }),
				new Map([["Shiv", current]]),
			).changed.map(({ name }) => name),
		).toEqual(["Shiv"]);
	});

	it("drops a restored item identical to its snapshot", () => {
		expect(
			mergeItemChanges(
				changes({ removed: [{ name: "Shiv", snapshot: item("Shiv", "100") }] }),
				changes({ added: [{ name: "Shiv" }] }),
				new Map([["Shiv", item("Shiv", "100")]]),
			),
		).toEqual(changes());
	});

	it("moves a changed item to removed when the hotfix deletes it", () => {
		const snapshot = item("Shiv", "90");
		expect(
			mergeItemChanges(
				changes({ changed: [{ name: "Shiv", changes: [stat("100", "90")] }] }),
				changes({ removed: [{ name: "Shiv", snapshot }] }),
				new Map(),
			),
		).toEqual(changes({ removed: [{ name: "Shiv", snapshot }] }));
	});

	it("composes changed items and drops the ones that net out", () => {
		expect(
			mergeItemChanges(
				changes({
					changed: [
						{ name: "Shiv", changes: [stat("100", "90")] },
						{ name: "Kudzu", changes: [stat("5", "6")] },
					],
				}),
				changes({
					changed: [
						{ name: "Shiv", changes: [stat("90", "100")] },
						{ name: "Kudzu", changes: [stat("6", "7")] },
					],
				}),
				new Map(),
			),
		).toEqual(
			changes({ changed: [{ name: "Kudzu", changes: [stat("5", "7")] }] }),
		);
	});
});

describe("mergeAbilityTiers", () => {
	const row = (partial: Partial<TierRow> & Pick<TierRow, "kind">): TierRow => ({
		key: "Damage",
		label: "Damage",
		...partial,
	});
	const tiers = (rows: TierRow[], text?: TierDiff["text"]): TierDiff[] => [
		{ tier: 1, rows, text },
		{ tier: 2, rows: [] },
		{ tier: 3, rows: [] },
	];

	it("carries an earlier change through a hotfix that did not touch it", () => {
		expect(
			mergeAbilityTiers(
				{ Fireball: tiers([row({ kind: "changed", old: 20, new: 30 })]) },
				{ Fireball: tiers([row({ kind: "equal", new: 30 })]) },
			).Fireball[0].rows,
		).toEqual([row({ kind: "changed", old: 20, new: 30 })]);
	});

	it("composes a second tweak and settles a revert to equal", () => {
		expect(
			mergeAbilityTiers(
				{ Fireball: tiers([row({ kind: "changed", old: 20, new: 30 })]) },
				{ Fireball: tiers([row({ kind: "changed", old: 30, new: 25 })]) },
			).Fireball[0].rows,
		).toEqual([row({ kind: "changed", old: 20, new: 25 })]);
		expect(
			mergeAbilityTiers(
				{ Fireball: tiers([row({ kind: "changed", old: 20, new: 30 })]) },
				{ Fireball: tiers([row({ kind: "changed", old: 30, new: 20 })]) },
			).Fireball[0].rows,
		).toEqual([row({ kind: "equal", new: 20 })]);
	});

	it("drops a row added then removed, and keeps an earlier removed row", () => {
		const gone = row({
			key: "Radius",
			label: "Radius",
			kind: "removed",
			old: 2,
		});
		expect(
			mergeAbilityTiers(
				{ Fireball: tiers([row({ kind: "added", new: 5 }), gone]) },
				{ Fireball: tiers([row({ kind: "removed", old: 5 })]) },
			).Fireball[0].rows,
		).toEqual([gone]);
	});

	it("composes tier text and drops it when reverted", () => {
		const merged = (first?: TierDiff["text"], second?: TierDiff["text"]) =>
			mergeAbilityTiers(
				{ Fireball: tiers([], first) },
				{ Fireball: tiers([], second) },
			).Fireball[0].text;
		expect(merged({ old: "a", new: "b" }, undefined)).toEqual({
			old: "a",
			new: "b",
		});
		expect(merged({ old: "a", new: "b" }, { old: "b", new: "c" })).toEqual({
			old: "a",
			new: "c",
		});
		expect(
			merged({ old: "a", new: "b" }, { old: "b", new: "a" }),
		).toBeUndefined();
	});

	it("keeps abilities the hotfix no longer lists", () => {
		const earlier = tiers([row({ kind: "changed", old: 1, new: 2 })]);
		expect(mergeAbilityTiers({ Fireball: earlier }, {}).Fireball).toBe(earlier);
	});
});

describe("mergeHeroChanges", () => {
	const hero = (partial: Partial<HeroChanges> = {}): HeroChanges => ({
		stats: [],
		weapon: [],
		abilities: {},
		...partial,
	});
	const noTiers = {};

	it("drops a hero whose changes all revert", () => {
		expect(
			mergeHeroChanges(
				{ Haze: hero({ stats: [modified(600, 650)] }) },
				{ Haze: hero({ stats: [modified(650, 600)] }) },
				noTiers,
				new Map(),
			),
		).toEqual({});
	});

	it("merges per list and per ability, and adds heroes new to the window", () => {
		expect(
			mergeHeroChanges(
				{
					Haze: hero({
						weapon: [modified(10, 8)],
						abilities: { Sleep: [modified(3, 2)] },
					}),
				},
				{
					Haze: hero({
						abilities: { Sleep: [modified(2, 3)], Smoke: [added(1)] },
					}),
					Wraith: hero({ stats: [modified(1, 2)] }),
				},
				noTiers,
				new Map(),
			),
		).toEqual({
			Haze: hero({
				weapon: [modified(10, 8)],
				abilities: { Smoke: [added(1)] },
			}),
			Wraith: hero({ stats: [modified(1, 2)] }),
		});
	});

	it("keeps a hero whose only surviving change is an upgrade tier", () => {
		const changedTier: TierDiff[] = [
			{
				tier: 1,
				rows: [{ key: "D", label: "D", kind: "changed", old: 1, new: 2 }],
			},
		];
		expect(
			mergeHeroChanges(
				{ Haze: hero({ stats: [modified(600, 650)] }) },
				{ Haze: hero({ stats: [modified(650, 600)] }) },
				{ Sleep: changedTier },
				new Map([["Haze", ["Sleep"]]]),
			),
		).toEqual({ Haze: hero() });
	});

	it("keeps a hero released earlier in the window new, with its later changes", () => {
		const isNew = true as const;
		expect(
			mergeHeroChanges(
				{ RatKing: hero({ isNew }), Haze: hero({ isNew }) },
				{
					RatKing: hero({ abilities: { Grenade: [modified(65, 70)] } }),
					Calico: hero({ isNew }),
				},
				noTiers,
				new Map(),
			),
		).toEqual({
			RatKing: hero({ isNew, abilities: { Grenade: [modified(65, 70)] } }),
			Haze: hero({ isNew }),
			Calico: hero({ isNew }),
		});
	});
});

describe("hotfix tags", () => {
	const hero = (hotfix?: number): HeroChanges => ({
		stats: [],
		weapon: [],
		abilities: {},
		...(hotfix && { hotfix }),
	});
	const items = (hotfix?: number): StoredItemChanges => ({
		added: [{ name: "New", ...(hotfix && { hotfix }) }],
		removed: [],
		changed: [{ name: "Healbane", changes: [] }],
	});

	it("tags only the newest hotfix's names, clearing older tags", () => {
		const { heroes, items: tagged } = tagHotfix(
			{ Sinclair: hero(), Haze: hero(6739) },
			items(6739),
			{ build: 6753, heroes: ["Sinclair", "Gone"], items: ["Healbane"] },
		);
		expect(heroes).toEqual({ Sinclair: hero(6753), Haze: hero() });
		expect(tagged.added).toEqual([{ name: "New" }]);
		expect(tagged.changed).toEqual([
			{ name: "Healbane", changes: [], hotfix: 6753 },
		]);
		expect(readHotfix(heroes, tagged)).toEqual({
			build: 6753,
			heroes: ["Sinclair"],
			items: ["Healbane"],
		});
	});

	it("reads no hotfix from untagged files", () => {
		expect(readHotfix({ Haze: hero() }, items())).toBeUndefined();
	});

	describe("nextHotfix", () => {
		const previous = { build: 6739, heroes: ["Haze"], items: [] };
		const touched = { heroes: ["Sinclair"], items: ["Healbane"] };

		it("makes a merged build the hotfix, replacing the previous one", () => {
			expect(nextHotfix("merge", 6722, previous, 6753, touched)).toEqual({
				build: 6753,
				...touched,
			});
		});

		it("adds to the hotfix when the API re-publishes its build", () => {
			expect(nextHotfix("merge", 6722, previous, 6739, touched)).toEqual({
				build: 6739,
				heroes: ["Haze", "Sinclair"],
				items: ["Healbane"],
			});
		});

		it("keeps the hotfix when nothing visible moved or the patch is re-published", () => {
			expect(nextHotfix("keep", 6722, previous, 6760, touched)).toBe(previous);
			expect(nextHotfix("merge", 6722, previous, 6722, touched)).toBe(previous);
		});

		it("has no hotfix once a new patch opens a window", () => {
			expect(nextHotfix("open", 6800, previous, 6800, touched)).toBeUndefined();
		});
	});
});
