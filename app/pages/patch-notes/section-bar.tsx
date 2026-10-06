import Badge from "#/shared/components/badge";
import { formatPatchDate } from "#/shared/utils/formatPatchDate";
import { stickyBarRef } from "#/shared/utils/stickyBarRef";
import type { NoteRef } from "#/types";

export type BarLink = { href: string; label: string; count?: number };

/**
 * The hotfix's and the patch's own header, stuck under the navbar. Sticky is
 * bounded by its section, so scrolling out of the hotfix pushes its bar away
 * and the patch's takes its place. Jump targets inside the section offset by
 * its height through `--sticky-bar-height` (see `stickyBarRef`).
 */
export default function SectionBar({
	label,
	tone,
	builds,
	builtAt,
	note,
	links,
}: {
	label: string;
	tone: "hotfix" | "patch";
	builds: number[];
	/** The newest build's `version_datetime`. */
	builtAt?: string;
	note?: NoteRef;
	links: BarLink[];
}) {
	return (
		// Page-coloured so cards scrolling up are hidden behind the bar.
		<div
			ref={stickyBarRef}
			className="sticky top-(--nav-height) z-10 mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-white/10 border-b bg-[#0e0e13] py-2 text-gray-400 text-xs"
		>
			<h2
				className={`cut-corner px-2 py-0.5 font-extrabold text-sm uppercase tracking-wide ${tone === "hotfix" ? "bg-amber-400 text-black" : "bg-white/15 text-white"}`}
			>
				{label}
			</h2>
			{builtAt && (
				<span className="font-bold text-white">{formatPatchDate(builtAt)}</span>
			)}
			{builds.length > 0 && (
				<span className="cut-corner bg-white/10 px-2 py-0.5 font-medium">
					{builds.length === 1 ? "build" : "builds"} {builds.join(", ")}
				</span>
			)}
			{note && (
				<a
					className="min-w-0 truncate underline hover:text-white"
					href={note.link}
					target="_blank"
					rel="noreferrer"
				>
					{note.title}
				</a>
			)}
			<nav className="ml-auto flex flex-wrap gap-3">
				{links.map(({ href, label: linkLabel, count }) => (
					<a
						key={href}
						className="flex items-center gap-1.5 hover:text-white"
						href={href}
					>
						{linkLabel}
						{count !== undefined && <Badge>{count}</Badge>}
					</a>
				))}
			</nav>
		</div>
	);
}
