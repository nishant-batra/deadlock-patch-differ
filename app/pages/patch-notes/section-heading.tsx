import Badge from "#/shared/components/badge";
import { formatPatchDate } from "#/shared/utils/formatPatchDate";

export default function SectionHeading({
	children,
	count,
	source,
	as: Heading = "h2",
}: {
	children: React.ReactNode;
	count?: number;
	/** The update these changes came from - it is not always the newest one. */
	source?: { title: string; pubDate: string };
	/** `h3` for a group inside a section, like the hotfix's heroes. */
	as?: "h2" | "h3";
}) {
	return (
		<div className="mb-4">
			<Heading
				className={`flex items-center gap-2 font-bold ${Heading === "h2" ? "text-xl" : "text-lg"}`}
			>
				{children}
				{count !== undefined && <Badge>{count}</Badge>}
			</Heading>
			{source && (
				<p className="mt-0.5 text-gray-400 text-sm">
					{source.title} &middot; {formatPatchDate(source.pubDate)}
				</p>
			)}
		</div>
	);
}
