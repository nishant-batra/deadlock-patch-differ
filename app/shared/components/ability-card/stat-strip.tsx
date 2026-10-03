import clsx from "clsx";
import PropertyValue from "#/shared/components/property-value";
import { humaniseStatKey } from "#/shared/utils/statLabels";
import type { ItemProperty } from "#/types";

/** A section's minor stats: the grey strip of `value label` pairs under the boxes. */
export default function StatStrip({
	entries,
}: {
	entries: Array<{
		key: string;
		property: ItemProperty;
		previous?: string | number;
	}>;
}) {
	if (entries.length === 0) return null;
	return (
		<div className="grid grid-cols-2 gap-x-4 gap-y-2.5 bg-[#363531] px-4 py-3 text-[#d6d1c6] text-[13px]">
			{entries.map(({ key, property, previous }) => (
				<span
					key={key}
					className={clsx(
						previous !== undefined &&
							"outline-2 outline-[#f2c14e] outline-offset-2",
					)}
				>
					<b className="text-[#f4efe4]">
						<PropertyValue property={property} previous={previous} />
					</b>{" "}
					{property.label ?? humaniseStatKey(key)}
				</span>
			))}
		</div>
	);
}
