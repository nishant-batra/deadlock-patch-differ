import Badge from "#/shared/components/badge";
import { formatPatchDate } from "#/shared/utils/formatPatchDate";

export default function SectionHeading({
	children,
	count,
	source,
}: {
	children: React.ReactNode;
	count?: number;
	/** The update these changes came from - it is not always the newest one. */
	source?: { title: string; pubDate: string };
}) {
	return (
		<div className="mb-4">
			<h2 className="flex items-center gap-2 font-bold text-xl">
				{children}
				{count !== undefined && <Badge>{count}</Badge>}
			</h2>
			{source && (
				<p className="mt-0.5 text-gray-400 text-sm">
					{source.title} &middot; {formatPatchDate(source.pubDate)}
				</p>
			)}
		</div>
	);
}
