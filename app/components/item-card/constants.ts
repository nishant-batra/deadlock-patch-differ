import { ItemSlotType } from "#/types";

export const COLOR_MAP: Record<ItemSlotType, Record<string, string>> = {
	weapon: {
		primary: "#C47820",
		description: "#634222",
		highlight: "#432C16",
	},
	spirit: { primary: "#C364A9", description: "#542E42", highlight: "#39222B" },
	vitality: {
		primary: "#7B912F",
		description: "#494D27",
		highlight: "#30391C",
	},
};
/**
 * Abilities have no `item_slot_type`, and one malformed item must not be able
 * to blank the page - both fall back to this.
 */
export const NEUTRAL: Record<string, string> = {
	primary: "#3A3A47",
	description: "#20202A",
	highlight: "#2A2A36",
};

export const colorsFor = (slot: ItemSlotType | undefined) =>
	(slot && COLOR_MAP[slot]) || NEUTRAL;

export const itemTypes: Array<ItemSlotType> = [
	ItemSlotType.WEAPON,
	ItemSlotType.SPIRIT,
	ItemSlotType.VITALITY,
];
