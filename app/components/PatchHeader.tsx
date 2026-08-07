import { Link } from "@tanstack/react-router";
import type { PatchMeta } from "#/types";
import { formatPatchDate } from "#/utils/common-utils";

export default function PatchHeader({ meta }: { meta: PatchMeta | null }) {
	return (
		<header className="border-white/10 border-b px-4 py-5 sm:px-8">
			<div className="mx-auto flex max-w-7xl flex-wrap items-baseline gap-x-4 gap-y-2">
				<h1 className="font-extrabold text-2xl tracking-tight">
					Deadlock Patch Differ
				</h1>

				{meta ? (
					<>
						<p className="text-gray-300">
							Patch{" "}
							<span className="font-bold text-white">
								{formatPatchDate(meta.versionDatetime)}
							</span>
						</p>
						<span className="rounded-full bg-white/10 px-2.5 py-0.5 font-medium text-gray-400 text-xs">
							build {meta.clientVersion}
						</span>
						<span className="text-gray-400 text-sm">
							{meta.counts.items} item
							{meta.counts.items === 1 ? "" : "s"} &middot; {meta.counts.heroes}{" "}
							hero
							{meta.counts.heroes === 1 ? "" : "es"} changed
						</span>
					</>
				) : (
					<p className="text-gray-400">No patch data ingested yet.</p>
				)}

				<nav className="ml-auto flex gap-4 text-sm">
					<Link
						to="/"
						className="text-gray-300 hover:text-white [&.active]:font-bold [&.active]:text-white"
					>
						Changes
					</Link>
					<Link
						to="/items"
						className="text-gray-300 hover:text-white [&.active]:font-bold [&.active]:text-white"
					>
						All items
					</Link>
				</nav>
			</div>
		</header>
	);
}
