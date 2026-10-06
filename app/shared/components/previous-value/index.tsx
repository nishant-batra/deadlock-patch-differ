import { formatDeltaValue } from "#/shared/components/stat-delta";

/**
 * A stat's pre-patch value, struck through just before the new one, at 90% of
 * the value beside it - smaller and it was unreadable in the small chips.
 */
export default function PreviousValue({ value }: { value: unknown }) {
	return (
		<s className="mr-1.5 font-medium text-[0.9em] text-gray-400 decoration-[1.5px] decoration-rose-400">
			{formatDeltaValue(value)}
		</s>
	);
}
