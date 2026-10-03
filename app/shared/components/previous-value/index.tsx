import { formatDeltaValue } from "#/shared/components/stat-delta";

/** A stat's pre-patch value, struck through just before the new one. */
export default function PreviousValue({ value }: { value: unknown }) {
	return (
		<s className="mr-1.5 font-medium text-[0.62em] text-gray-400 decoration-[1.5px] decoration-rose-400">
			{formatDeltaValue(value)}
		</s>
	);
}
