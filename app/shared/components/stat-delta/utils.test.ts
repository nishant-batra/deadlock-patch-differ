import { describe, expect, it } from "vitest";
import type { DisplayChange, Item } from "#/types";
import {
	type DeltaRow,
	deltaDirection,
	formatDeltaValue,
	resolveDeltaRows,
	toneOfDeltaRow,
} from "./utils";

// Toxic Bullets' two healing penalties, as they sit in the live catalog -
// distinct keys, one shared label.
const TOXIC_BULLETS: Item["properties"] = {
	HealAmpReceivePenaltyPercent: {
		value: "-35",
		label: "Incoming Healing",
		postfix: "%",
	},
	HealAmpRegenPenaltyPercent: {
		value: "-35",
		label: "Incoming Healing",
		postfix: "%",
	},
	AbilityCooldown: { value: "20", postfix: "s" },
};

const stat = (key: string, old: string, next: string): DisplayChange => ({
	kind: "stat",
	section: "passive",
	key,
	label: TOXIC_BULLETS[key]?.label ?? key,
	old,
	new: next,
});

describe("resolveDeltaRows", () => {
	it("tells apart two properties that share a label (Toxic Bullets)", () => {
		const rows = resolveDeltaRows(
			[
				stat("HealAmpReceivePenaltyPercent", "-35", "-40"),
				stat("HealAmpRegenPenaltyPercent", "-35", "-40"),
			],
			TOXIC_BULLETS,
		);
		expect(rows.map(({ label }) => label)).toEqual([
			"Incoming Healing (Heal Amp Receive Penalty Percent)",
			"Incoming Healing (Heal Amp Regen Penalty Percent)",
		]);
		expect(rows[0]).toMatchObject({
			id: "0:passive.HealAmpReceivePenaltyPercent",
			kind: "stat",
			postfix: "%",
		});
		expect(rows[0]).not.toHaveProperty("key");
	});

	it("leaves a unique label alone", () => {
		const [row] = resolveDeltaRows(
			[stat("HealAmpReceivePenaltyPercent", "-35", "-40")],
			TOXIC_BULLETS,
		);
		expect(row.label).toBe("Incoming Healing");
	});

	it("treats a cooldown as a negative stat with the cooldown's unit", () => {
		const [row] = resolveDeltaRows(
			[{ kind: "cooldown", section: "active", old: 20, new: 25 }],
			TOXIC_BULLETS,
		);
		expect(row).toEqual({
			id: "0:active.cooldown",
			label: "Cooldown",
			kind: "stat",
			old: 20,
			new: 25,
			negativeAttribute: true,
			postfix: "s",
		});
	});

	it("maps added/removed rows and cost, and skips text and component changes", () => {
		const rows = resolveDeltaRows(
			[
				{ kind: "cost", old: 1600, new: 3200 },
				{ kind: "text", section: "passive", old: "a", new: "b" },
				{ kind: "components", old: [], new: ["Headshot Booster"] },
				{
					kind: "row-added",
					section: "passive",
					key: "HealAmpRegenPenaltyPercent",
					label: "Regen Penalty",
					value: "-35",
				},
				{
					kind: "row-removed",
					section: "passive",
					key: "HealAmpReceivePenaltyPercent",
					label: "Receive Penalty",
					value: "-35",
				},
			],
			TOXIC_BULLETS,
		);
		expect(
			rows.map(({ id, kind, old, new: next }) => [id, kind, old, next]),
		).toEqual([
			["0:cost", "stat", 1600, 3200],
			["3:passive.HealAmpRegenPenaltyPercent", "added", undefined, "-35"],
			["4:passive.HealAmpReceivePenaltyPercent", "removed", "-35", undefined],
		]);
	});
});

describe("formatDeltaValue", () => {
	it("trims float noise and keeps integers as-is", () => {
		expect(formatDeltaValue(0.1 + 0.2)).toBe("0.3");
		expect(formatDeltaValue(25)).toBe("25");
	});

	it("renders missing, boolean, array and object values", () => {
		expect(formatDeltaValue(undefined)).toBe("—");
		expect(formatDeltaValue(null)).toBe("—");
		expect(formatDeltaValue(true)).toBe("true");
		expect(formatDeltaValue(["a", "b"])).toBe("2 entries");
		expect(formatDeltaValue({ a: 1 })).toBe("…");
	});
});

const row = (overrides: Partial<DeltaRow>): DeltaRow => ({
	id: "x",
	label: "X",
	kind: "stat",
	...overrides,
});

describe("deltaDirection", () => {
	it("reads a rise as better unless the stat is negative", () => {
		expect(deltaDirection(row({ old: 20, new: 25 }))).toBe("better");
		expect(
			deltaDirection(row({ old: "20", new: "25", negativeAttribute: true })),
		).toBe("worse");
	});

	it("treats added as better and removed as worse", () => {
		expect(deltaDirection(row({ kind: "added", new: 5 }))).toBe("better");
		expect(deltaDirection(row({ kind: "removed", old: 5 }))).toBe("worse");
	});

	it("stays neutral for equal or non-numeric moves", () => {
		expect(deltaDirection(row({ old: 5, new: 5 }))).toBe("neutral");
		expect(deltaDirection(row({ old: "fast", new: "slow" }))).toBe("neutral");
		expect(deltaDirection(row({ old: undefined, new: 5 }))).toBe("neutral");
	});

	it("maps direction to a text tone", () => {
		expect(toneOfDeltaRow(row({ old: 20, new: 25 }))).toBe("text-emerald-300");
		expect(toneOfDeltaRow(row({ old: 25, new: 20 }))).toBe("text-rose-300");
		expect(toneOfDeltaRow(row({ old: 5, new: 5 }))).toBe("text-gray-200");
	});
});
