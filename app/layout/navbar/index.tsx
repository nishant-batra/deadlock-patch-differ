import { Link, useLocation } from "@tanstack/react-router";
import Badge from "#/shared/components/badge";
import { itemTypes } from "#/shared/components/item-card/constants";
import { formatPatchDate } from "#/shared/utils/formatPatchDate";
import type { PatchMeta } from "#/types";
import { useNavHeight } from "./useNavHeight";

const CHIP =
	"cut-corner px-3 py-1.5 font-bold text-gray-300 hover:text-white [&.active]:bg-amber-400 [&.active]:text-black";

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
			<div className="mx-auto max-w-7xl px-4 pt-4 sm:px-8">
				<Link
					to="/"
					className="font-extrabold text-2xl tracking-tight hover:text-gray-200"
				>
					Deadlock Patch Comparator
				</Link>
			</div>

			<nav className="mx-auto flex max-w-7xl gap-2 px-4 py-2.5 text-sm sm:px-8">
				<Link to="/" className={CHIP}>
					Changes
				</Link>
				<Link to="/items" search={{ type: itemTypes[0] }} className={CHIP}>
					All items
				</Link>
				<Link to="/heroes" className={CHIP}>
					All heroes
				</Link>
				<Link to="/compare" search={{ heroes: [] }} className={CHIP}>
					Compare
				</Link>
			</nav>

			<div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1.5 border-white/10 border-t px-4 py-2 text-gray-400 text-xs sm:px-8">
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
						<span>
							{meta.counts.items} item{meta.counts.items === 1 ? "" : "s"}{" "}
							&middot; {meta.counts.heroes} hero
							{meta.counts.heroes === 1 ? "" : "es"} changed
						</span>
					</>
				) : (
					<p>No patch data ingested yet.</p>
				)}

				{onChangesPage && meta && (
					<div className="ml-auto flex gap-3">
						<a
							className="flex items-center gap-1.5 hover:text-white"
							href="#items"
						>
							Items <Badge>{meta.counts.items}</Badge>
						</a>
						<a
							className="flex items-center gap-1.5 hover:text-white"
							href="#heroes"
						>
							Heroes <Badge>{meta.counts.heroes}</Badge>
						</a>
						<a className="hover:text-white" href="#general">
							General
						</a>
					</div>
				)}
			</div>
		</header>
	);
}
