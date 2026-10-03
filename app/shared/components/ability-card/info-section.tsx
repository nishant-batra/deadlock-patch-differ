import GameText from "#/shared/components/game-text";
import { isPlaceholderZero } from "#/shared/utils/statFormatting";
import type { Change, Item, InfoSection as Section } from "#/types";
import StatBox from "./stat-box";
import StatStrip from "./stat-strip";
import type { FaceChanges } from "./utils";

/**
 * One tooltip section: its copy (diffed in place when rewritten), each
 * property block's big stat boxes under the block's own heading, then the
 * strip of basic properties.
 */
export default function InfoSection({
	section: { loc_string, properties_block = [], basic_properties = [] },
	properties,
	textChange,
	shown: { previous, previousScale },
}: {
	section: Section;
	properties: Item["properties"];
	textChange?: Change;
	shown: FaceChanges;
}) {
	// Unchanged zeros are upgrade-gated placeholders - see `isPlaceholderZero`.
	const visible = (key: string) =>
		properties[key] !== undefined &&
		!isPlaceholderZero(properties[key], previous.has(key));
	const blockKeys = new Set(
		properties_block.flatMap(
			({ properties: entries }) =>
				entries?.map(({ important_property }) => important_property) ?? [],
		),
	);
	// A key can be both a block's important property and a basic one; the box wins.
	const strip = [...new Set(basic_properties)]
		.filter((key) => !blockKeys.has(key) && visible(key))
		.map((key) => ({
			key,
			property: properties[key],
			previous: previous.get(key),
		}));

	return (
		<section className="flex flex-col gap-3">
			{loc_string && (
				<GameText
					html={loc_string}
					previous={textChange ? String(textChange.old ?? "") : undefined}
					className="text-[#cfcac0] text-[15px] leading-normal"
				/>
			)}
			{properties_block.map(
				({ loc_string: heading, properties: entries }, index) => {
					const keys = [
						...new Set(
							entries?.map(({ important_property }) => important_property) ??
								[],
						),
					].filter(visible);
					if (keys.length === 0) return null;
					return (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: blocks have no id and never reorder
							key={index}
							className="flex flex-col gap-2"
						>
							{heading && (
								<p className="font-bold text-[#a8a397] text-[11px] uppercase tracking-widest">
									{heading}
								</p>
							)}
							<div className="grid grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-1.5">
								{keys.map((key) => (
									<StatBox
										key={key}
										propertyKey={key}
										property={properties[key]}
										previous={previous.get(key)}
										previousScale={previousScale.get(key)}
									/>
								))}
							</div>
						</div>
					);
				},
			)}
			<StatStrip entries={strip} />
		</section>
	);
}
