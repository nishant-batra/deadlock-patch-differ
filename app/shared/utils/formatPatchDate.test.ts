import { describe, expect, it } from "vitest";
import { formatPatchDate } from "./formatPatchDate";

describe("formatPatchDate", () => {
	it("treats a zoneless timestamp as UTC", () => {
		expect(formatPatchDate("2026-10-02T14:31:08")).toBe("2 October 2026");
	});

	it("keeps an explicit zone", () => {
		expect(formatPatchDate("2026-07-09T19:26:55Z")).toBe("9 July 2026");
		// 23:30 at -05:00 is already the next day in UTC.
		expect(formatPatchDate("2026-07-09T23:30:00-05:00")).toBe("10 July 2026");
	});

	it("returns unparseable input unchanged", () => {
		expect(formatPatchDate("not a date")).toBe("not a date");
	});
});
