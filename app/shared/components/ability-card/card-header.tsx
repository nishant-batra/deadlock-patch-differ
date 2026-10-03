import clsx from "clsx";
import PropertyValue from "#/shared/components/property-value";
import type { Item, ItemProperty } from "#/types";
import type { FaceChanges } from "./utils";

/** A cost chip: the property's own icon and value, framed amber when it moved. */
function Chip({
	property,
	previous,
}: {
	property: ItemProperty;
	previous?: string | number;
}) {
	const { icon, label } = property;
	return (
		<span
			title={label}
			className={clsx(
				"inline-flex items-center gap-1.5 rounded bg-[#34332f] px-2 py-1 font-bold text-[#ece7db] text-[13px]",
				previous !== undefined &&
					"outline-2 outline-[#f2c14e] outline-offset-2",
			)}
		>
			{icon && (
				<img src={icon} alt="" width={14} height={14} className="opacity-75" />
			)}
			<PropertyValue property={property} previous={previous} />
		</span>
	);
}

/**
 * The card's title row. Range/area/duration sit under the name and
 * charges/cooldowns in the corner, as in game; `end` is the caller's slot
 * (the popover's close button) so the card itself knows nothing about where
 * it is shown.
 */
export default function CardHeader({
	ability: { name, properties = {} },
	chips: { left, right },
	previous,
	end,
}: {
	ability: Item;
	chips: { left: string[]; right: string[] };
	previous: FaceChanges["previous"];
	end?: React.ReactNode;
}) {
	const renderChips = (keys: string[]) =>
		keys.map((key) => (
			<Chip key={key} property={properties[key]} previous={previous.get(key)} />
		));

	return (
		<div className="flex items-start justify-between gap-3">
			<div className="flex min-w-0 flex-col gap-2.5">
				<h3 className="font-display text-[#f4ead6] text-[1.75rem] leading-none">
					{name}
				</h3>
				{left.length > 0 && (
					<div className="flex flex-wrap gap-1.5">{renderChips(left)}</div>
				)}
			</div>
			<div className="flex items-start gap-2">
				{right.length > 0 && (
					<div className="flex flex-wrap justify-end gap-1.5">
						{renderChips(right)}
					</div>
				)}
				{end}
			</div>
		</div>
	);
}
