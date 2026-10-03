import { describe, expect, it } from "vitest";
import { diffWords, type WordDiffOp } from "./wordDiff";

const side = (ops: WordDiffOp[], skip: WordDiffOp["op"]) =>
	ops
		.filter(({ op }) => op !== skip)
		.map(({ text }) => text)
		.join("");

describe("diffWords", () => {
	it("marks only the swapped word", () => {
		expect(diffWords("Deals 50 damage", "Deals 60 damage")).toEqual([
			{ op: "equal", text: "Deals " },
			{ op: "delete", text: "50" },
			{ op: "insert", text: "60" },
			{ op: "equal", text: " damage" },
		]);
	});

	it("marks an inserted clause without restriking its neighbours", () => {
		const before = "Grants Bullet Resist and Spirit Resist";
		const after = "Grants Bullet Resist, Debuff Resist and Spirit Resist";
		const ops = diffWords(before, after);

		expect(ops.some(({ op }) => op === "delete")).toBe(false);
		expect(ops.slice(0, 2)).toEqual([
			{ op: "equal", text: "Grants Bullet Resist" },
			{ op: "insert", text: "," },
		]);
		expect(ops.at(-1)).toEqual({ op: "equal", text: "and Spirit Resist" });
		expect(side(ops, "insert")).toBe(before);
		expect(side(ops, "delete")).toBe(after);
	});

	it("keeps hyphenated words and percentages as single tokens", () => {
		expect(diffWords("non-ultimate 150%", "non-ultimate 200%")).toEqual([
			{ op: "equal", text: "non-ultimate " },
			{ op: "delete", text: "150%" },
			{ op: "insert", text: "200%" },
		]);
	});

	it("never half-matches icon placeholders", () => {
		expect(diffWords("$svg$", "$img$")).toEqual([
			{ op: "delete", text: "$svg$" },
			{ op: "insert", text: "$img$" },
		]);
	});

	it("handles empty sides", () => {
		expect(diffWords("", "new text")).toEqual([
			{ op: "insert", text: "new text" },
		]);
		expect(diffWords("old text", "")).toEqual([
			{ op: "delete", text: "old text" },
		]);
		expect(diffWords("same", "same")).toEqual([{ op: "equal", text: "same" }]);
	});
});
