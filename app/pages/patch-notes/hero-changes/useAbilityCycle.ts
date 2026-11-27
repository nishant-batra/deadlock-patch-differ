import { useMemo, useState } from "react";
import type { StepTarget } from "#/shared/components/ability-popover/types";
import type { OpenState } from "#/shared/components/ability-row";
import { isAbilityChanged } from "#/shared/components/ability-row/utils";
import type { ChangedHero } from "#/types";

/** One changed ability: `card` is its hero card's place in the page's list. */
type Stop = { card: number; index: number };
type Open = Stop & { preview: boolean; status: "open" | "closing" };

const closing = (current: Open): Open => ({ ...current, status: "closing" });

/**
 * Which ability popover is open across every changed-hero card on the page -
 * hotfix and patch lists together, so only one is ever open. The popover's
 * prev/next walk the changed abilities of the card's own list: past the end of
 * one hero into the next, wrapping at both ends of that list. Closing goes
 * through "closing" so the popover can play its exit animation first.
 *
 * Returns `forCard(card)`: that card's slice of the state, in the shape
 * `AbilityRow`'s `openState` takes. Cards with nothing open get the same
 * object every render, so a hover only re-renders the cards it touches.
 */
export function useAbilityCycle(lists: ChangedHero[][]) {
	const [open, setOpen] = useState<Open | null>(null);

	const { cards, places, stops, closed } = useMemo(() => {
		const cards = lists.flat();
		// Each card's list, and its place in it for "Hero X of N".
		const places = lists.flatMap((heroes, list) =>
			heroes.map((_, at) => ({ list, position: at + 1, total: heroes.length })),
		);
		const update = setOpen;
		const onCard = (card: number, current: Open | null) =>
			current?.card === card;

		const closed = cards.map(
			(_, card): OpenState => ({
				openAbility: null,
				preview: false,
				status: "closed",
				toggle: (index) =>
					update((current) =>
						current &&
						onCard(card, current) &&
						current.index === index &&
						!current.preview &&
						current.status === "open"
							? closing(current)
							: { card, index, preview: false, status: "open" },
					),
				showPreview: (index) =>
					update((current) =>
						current && !current.preview && current.status === "open"
							? current
							: { card, index, preview: true, status: "open" },
					),
				closePreview: () =>
					update((current) =>
						current && onCard(card, current) && current.preview
							? closing(current)
							: current,
					),
				close: () =>
					update((current) =>
						current && onCard(card, current) ? closing(current) : current,
					),
				onClosed: () =>
					update((current) =>
						onCard(card, current) && current?.status === "closing"
							? null
							: current,
					),
			}),
		);
		// Every changed ability, grouped by list: prev/next never leave a list.
		const stops: Stop[][] = lists.map(() => []);
		for (const [card, { abilities }] of cards.entries())
			for (const [index, ability] of abilities.entries())
				if (isAbilityChanged(ability))
					stops[places[card].list].push({ card, index });
		return { cards, places, stops, closed };
	}, [lists]);

	const go = (stop: Stop) => () =>
		setOpen({ ...stop, preview: false, status: "open" });

	return (card: number): OpenState => {
		if (open?.card !== card) return closed[card];
		const { index: openAbility, preview, status } = open;
		const { hero, abilities } = cards[card];
		const { list, position: heroPosition, total } = places[card];
		const listStops = stops[list];
		const position = listStops.findIndex(
			(stop) => stop.card === card && stop.index === openAbility,
		);

		const target = (direction: -1 | 1): StepTarget => {
			const at = position + direction;
			const stop = listStops[(at + listStops.length) % listStops.length];
			const { hero: stopHero, abilities: stopAbilities } = cards[stop.card];
			return {
				name: stopAbilities[stop.index].ability.name,
				heroName: stop.card === card ? undefined : stopHero.name,
				wraps: at < 0 || at >= listStops.length,
				go: go(stop),
			};
		};
		const canStep = listStops.length > 1;

		return {
			...closed[card],
			openAbility,
			preview,
			status,
			// Only for a changed ability.
			nav:
				position < 0
					? undefined
					: {
							hero: canStep
								? { name: hero.name, position: heroPosition, total }
								: undefined,
							changes: listStops
								.filter((stop) => stop.card === card)
								.map((stop) => ({
									name: abilities[stop.index].ability.name,
									current: stop.index === openAbility,
									go: go(stop),
								})),
							prev: canStep ? target(-1) : undefined,
							next: canStep ? target(1) : undefined,
						},
		};
	};
}
