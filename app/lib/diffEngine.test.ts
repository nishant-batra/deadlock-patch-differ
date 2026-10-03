import { describe, expect, it } from "vitest";
import {
	type Change,
	generateDeadlockPatchDiff,
	hasAnyChange,
	isScaleChange,
	isStatChange,
	pruneUnmodified,
	statKeyOf,
	summarize,
} from "./diffEngine";

const haze = (maxHealth: number, extra: Record<string, unknown> = {}) => ({
	name: "Haze",
	class_name: "hero_haze",
	starting_stats: {
		max_health: { value: maxHealth },
		stamina: { value: 3 },
	},
	...extra,
});

describe("generateDeadlockPatchDiff", () => {
	it("keys entries by name, so reordering the array is not a change", () => {
		const wraith = { name: "Wraith", clip_size: 50 };
		const diff = generateDeadlockPatchDiff(
			[haze(550), wraith],
			[wraith, haze(550)],
		);
		expect(hasAnyChange(pruneUnmodified(diff))).toBe(false);
	});

	it("falls back to class_name for entries with no name", () => {
		const diff = generateDeadlockPatchDiff(
			[{ class_name: "upgrade_toxic_bullets", cost: 1600 }],
			[{ class_name: "upgrade_toxic_bullets", cost: 3200 }],
		);
		expect(diff.modified.upgrade_toxic_bullets.modified.cost).toEqual({
			old: 1600,
			new: 3200,
		});
	});

	it("separates added, removed and modified entries", () => {
		const diff = generateDeadlockPatchDiff(
			[haze(550), { name: "Retired" }],
			[haze(600), { name: "Rem" }],
		);
		expect(Object.keys(diff.added)).toEqual(["Rem"]);
		expect(Object.keys(diff.removed)).toEqual(["Retired"]);
		expect(Object.keys(diff.modified)).toEqual(["Haze"]);
	});

	it("compares arrays as whole values", () => {
		const diff = generateDeadlockPatchDiff(
			[{ name: "Haze", tags: ["Assassin", "Stealthy"] }],
			[{ name: "Haze", tags: ["Assassin", "Lethal"] }],
		);
		expect(diff.modified.Haze.modified.tags).toEqual({
			old: ["Assassin", "Stealthy"],
			new: ["Assassin", "Lethal"],
		});
	});
});

describe("pruneUnmodified + summarize", () => {
	it("drops untouched branches and flattens the rest to paths", () => {
		const diff = generateDeadlockPatchDiff(
			[haze(550, { gun_tag: "Rapid Fire" })],
			[haze(600, { complexity: 1 })],
		);
		const pruned = pruneUnmodified(diff);
		expect(pruned.modified.Haze).not.toHaveProperty("unmodified");

		expect(summarize(pruned)).toEqual([
			{ path: ["Haze", "complexity"], kind: "added", new: 1 },
			{ path: ["Haze", "gun_tag"], kind: "removed", old: "Rapid Fire" },
			{
				path: ["Haze", "starting_stats", "max_health", "value"],
				kind: "modified",
				old: 550,
				new: 600,
			},
		]);
	});

	it("returns no changes for a missing node", () => {
		expect(summarize(undefined)).toEqual([]);
		expect(summarize(null)).toEqual([]);
	});
});

const change = (path: string[]): Change => ({
	path,
	kind: "modified",
	old: 1,
	new: 2,
});

describe("change classifiers", () => {
	it("recognises a property value move as a stat change", () => {
		const bulletDamage = change(["properties", "BulletDamage", "value"]);
		expect(isStatChange(bulletDamage)).toBe(true);
		expect(isScaleChange(bulletDamage)).toBe(false);
		expect(statKeyOf(bulletDamage)).toBe("BulletDamage");
	});

	it("recognises a stat_scale move as a scale change (Plot Armor 0.2 -> 0.3)", () => {
		const scaling = change([
			"properties",
			"BaseAttackDamagePercent",
			"scale_function",
			"stat_scale",
		]);
		expect(isScaleChange(scaling)).toBe(true);
		expect(isStatChange(scaling)).toBe(false);
		expect(statKeyOf(scaling)).toBe("BaseAttackDamagePercent");
	});

	it("ignores value moves outside properties", () => {
		expect(
			isStatChange(change(["starting_stats", "max_health", "value"])),
		).toBe(false);
	});
});
