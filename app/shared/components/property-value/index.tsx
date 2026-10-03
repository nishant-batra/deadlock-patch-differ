import clsx from "clsx";
import PreviousValue from "#/shared/components/previous-value";
import {
	resolvePrefix,
	shouldAppendPostfix,
} from "#/shared/utils/statFormatting";
import type { ItemProperty } from "#/types";

/**
 * A property's value the way every slot on the card prints it - prefix,
 * number, small unit - with its pre-patch value struck in front when it moved.
 * Shared by the header chips, the stat boxes and the strip so a value reads
 * the same wherever the card puts it.
 */
export default function PropertyValue({
	property: { value, prefix, postfix },
	previous,
	unitClassName,
}: {
	property: ItemProperty;
	previous?: string | number;
	unitClassName?: string;
}) {
	return (
		<span className="inline-flex items-baseline">
			{previous !== undefined && <PreviousValue value={previous} />}
			{resolvePrefix(prefix)}
			{value}
			{shouldAppendPostfix(value, postfix) && (
				<span
					className={clsx(
						"ml-px font-semibold text-[#a8a397]",
						unitClassName ?? "text-[0.7em]",
					)}
				>
					{postfix}
				</span>
			)}
		</span>
	);
}
