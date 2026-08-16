import { createServerFn } from "@tanstack/react-start";
import { getAllHeroes } from "#/server/patchService";
import type { HeroEntry } from "#/types";

/**
 * Shared by `/heroes` and `/compare` - both render the same live roster, and a
 * second definition would let the two drift.
 *
 * The return type is explicit for the same reason as the routes: without it the
 * server-fn boundary widens the loader data to `any` and every downstream
 * callback loses its types.
 */
export const fetchHeroes = createServerFn({ method: "GET" }).handler(
	async (): Promise<HeroEntry[]> => getAllHeroes(),
);
