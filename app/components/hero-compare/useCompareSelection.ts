import { getRouteApi } from "@tanstack/react-router";

// `getRouteApi` rather than importing `Route` from the route module - that
// would be a circular import (the route module imports `HeroCompare`, which
// imports this hook).
const route = getRouteApi("/compare");

/**
 * Selection lives in the URL, not local state - a comparison is then
 * shareable and survives a reload. Always exposes 3 slots (even empty ones)
 * so the three selects render consistently regardless of how many heroes are
 * currently picked.
 */
export function useCompareSelection() {
	const { heroes } = route.useSearch();
	const navigate = route.useNavigate();

	const slots: (string | null)[] = [0, 1, 2].map((i) => heroes[i] ?? null);

	const setSlot = (index: number, classNameOrNull: string | null) => {
		const next = slots
			.map((value, i) => (i === index ? classNameOrNull : value))
			.filter((value): value is string => Boolean(value));
		navigate({
			search: { heroes: next },
			replace: true, // slot changes shouldn't stack up in browser history
		});
	};

	return {
		slots,
		setSlot,
		selected: slots.filter((value): value is string => Boolean(value)),
	};
}
