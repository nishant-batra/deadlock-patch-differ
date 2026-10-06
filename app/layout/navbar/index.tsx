import { Link, useLocation } from "@tanstack/react-router";
import { Coffee } from "lucide-react";
import { formatPatchDate } from "#/shared/utils/formatPatchDate";
import type { PatchMeta } from "#/types";
import { useNavHeight } from "./useNavHeight";

const BUY_ME_A_COFFEE_URL = "https://buymeacoffee.com/nishten";

// Horizontal padding shrinks with the viewport below ~394px (12px → 4px) so all
// four chips stay on one row without their labels wrapping.
const CHIP =
	"cut-corner whitespace-nowrap px-[clamp(4px,12.5vw_-_37.5px,12px)] py-1.5 font-bold text-gray-300 hover:text-white [&.active]:bg-amber-400 [&.active]:text-black";

/**
 * Sticky across every route (mounted once by the `_layout` route rather than
 * per-page) so it never flashes or reflows on navigation - `defaultViewTransition`
 * on the router pairs with this element's own view-transition-name so the rest
 * of the page transitions independently of it.
 */
export default function Navbar({ meta }: { meta: PatchMeta | null }) {
	const ref = useNavHeight<HTMLElement>();
	const { pathname } = useLocation();
	const onChangesPage = pathname === "/";

	return (
		<header
			ref={ref}
			className="sticky top-0 z-20 border-white/10 border-b bg-[#0e0e13]/95 backdrop-blur [view-transition-name:navbar]"
		>
			<div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 pt-3 sm:gap-4 sm:px-8 sm:pt-4">
				<Link
					to="/"
					className="min-w-0 truncate font-extrabold text-[clamp(1.125rem,5.5vw,1.5rem)] tracking-tight hover:text-gray-200 sm:text-3xl"
				>
					Deadlock Patch Comparator
				</Link>
				{/* Icon-only below `sm` so the title stays on a single line. */}
				<a
					href={BUY_ME_A_COFFEE_URL}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Buy me a coffee"
					title="Buy me a coffee"
					className="cut-corner flex shrink-0 items-center gap-1.5 bg-amber-400 px-2.5 py-1.5 font-bold text-black text-sm hover:bg-amber-300 sm:px-3"
				>
					<Coffee aria-hidden className="size-4" />
					<span className="hidden sm:inline">Buy me a coffee</span>
				</a>
			</div>

			<nav className="mx-auto flex max-w-7xl gap-2 px-4 py-2 text-sm sm:px-8 sm:py-2.5">
				<Link to="/" className={CHIP}>
					Changes
				</Link>
				<Link to="/items" className={CHIP}>
					All items
				</Link>
				<Link to="/heroes" className={CHIP}>
					All heroes
				</Link>
				<Link to="/compare" search={{ heroes: [] }} className={CHIP}>
					Compare
				</Link>
			</nav>

			{/* The Changes page shows this per section, in its sticky bars. */}
			{!onChangesPage && (
				<div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1.5 border-white/10 border-t px-4 py-1.5 text-gray-400 text-xs sm:px-8 sm:py-2">
					{meta ? (
						<>
							<p>
								Patch{" "}
								<span className="font-bold text-white">
									{formatPatchDate(meta.versionDatetime)}
								</span>
							</p>
							<span className="cut-corner bg-white/10 px-2 py-0.5 font-medium">
								build {meta.clientVersion}
							</span>
						</>
					) : (
						<p>No patch data ingested yet.</p>
					)}
				</div>
			)}
		</header>
	);
}
