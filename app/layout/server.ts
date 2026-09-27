// app/layout/server.ts
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import patchMetaJson from "#/data/patch-meta.json";
import type { PatchMeta } from "#/types";

export function getPatchMeta(): PatchMeta | null {
	return (patchMetaJson as unknown as PatchMeta | null) ?? null;
}

// Return type is explicit: without it the server-fn boundary widens the loader
// data to `any` and every downstream callback loses its types.
export const fetchPatchMeta = createServerFn({ method: "GET" }).handler(
	async (): Promise<PatchMeta | null> => {
		// Rebuilt by the deploy hook whenever new artifacts are committed.
		setResponseHeader("Cache-Control", "public, s-maxage=31536000, immutable");
		return getPatchMeta();
	},
);
