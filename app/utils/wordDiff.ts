// app/utils/wordDiff.ts
//
// Word-level diff for description rewrites. Striking the whole old sentence and
// printing the whole new one hides the actual change - most patch rewrites are
// an inserted clause or a one-word swap. This aligns the two at token level so
// only the words that moved are marked.
//
// Tokens are words, whitespace runs, and individual punctuation characters, each
// kept separate. That matters: "Resist and" -> "Resist, Debuff Resist and"
// should mark the comma and "Debuff Resist" as inserted, not restrike "Resist"
// just because a comma landed next to it.

export type WordDiffOp = { op: "equal" | "insert" | "delete"; text: string };

// A "word" keeps %, apostrophes and internal hyphens so "non-ultimate",
// "self-cast" and "150%" stay single tokens. Everything else is either a
// whitespace run or one punctuation character.
const WORD = "[A-Za-z0-9'’%-]+";
const TOKEN = new RegExp(`${WORD}|\\s+|[^\\sA-Za-z0-9'’%-]`, "g");

const tokenize = (text: string): string[] => text.match(TOKEN) ?? [];

/**
 * Classic longest-common-subsequence alignment. Both descriptions are a
 * sentence or two, so the O(n·m) table is trivially small. Consecutive tokens
 * with the same op are coalesced so an inserted clause and the spaces inside it
 * stay together as one run.
 */
export function diffWords(before: string, after: string): WordDiffOp[] {
	const a = tokenize(before);
	const b = tokenize(after);
	const m = a.length;
	const n = b.length;

	// dp[i][j] = LCS length of a[i:] and b[j:].
	const dp: number[][] = Array.from({ length: m + 1 }, () =>
		new Array(n + 1).fill(0),
	);
	for (let i = m - 1; i >= 0; i--) {
		for (let j = n - 1; j >= 0; j--) {
			dp[i][j] =
				a[i] === b[j]
					? dp[i + 1][j + 1] + 1
					: Math.max(dp[i + 1][j], dp[i][j + 1]);
		}
	}

	const ops: WordDiffOp[] = [];
	const push = (op: WordDiffOp["op"], text: string) => {
		const last = ops.at(-1);
		if (last && last.op === op) last.text += text;
		else ops.push({ op, text });
	};

	let i = 0;
	let j = 0;
	while (i < m && j < n) {
		if (a[i] === b[j]) {
			push("equal", a[i]);
			i++;
			j++;
		} else if (dp[i + 1][j] >= dp[i][j + 1]) {
			push("delete", a[i]);
			i++;
		} else {
			push("insert", b[j]);
			j++;
		}
	}
	while (i < m) push("delete", a[i++]);
	while (j < n) push("insert", b[j++]);

	return ops;
}
