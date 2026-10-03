import { faceKeys } from "#/shared/components/ability-card/utils";
import { humaniseStatKey } from "#/shared/utils/statLabels";
import type { Item } from "#/types";

/**
 * Every non-zero property the in-game card does not show. Labelled ones first -
 * the game names them, so they read as real stats - then the raw-keyed rest.
 */
export function allStatRows(ability: Item) {
	const { properties = {} } = ability;
	const face = faceKeys(ability);
	const rows = Object.entries(properties)
		.filter(
			([key, { value }]) =>
				!face.has(key) &&
				value !== undefined &&
				value !== "" &&
				Number.parseFloat(String(value)) !== 0,
		)
		.map(([key, property]) => ({
			key,
			property,
			labelled: Boolean(property.label),
			label: property.label ?? humaniseStatKey(key),
		}));
	return [
		...rows.filter(({ labelled }) => labelled),
		...rows.filter(({ labelled }) => !labelled),
	];
}
