import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Fragment } from "react";
import HeroCard from "#/components/hero-card";
import ItemCard from "#/components/item-card";
import Legend from "#/components/legend";
import HeroLegend from "#/components/legend/hero-legend";
import SectionNav, { Badge } from "#/components/section-nav";
import {
	getChangedHeroes,
	getItemChanges,
	getPatchNotes,
} from "#/server/patchService";
import type { ChangedHero, ItemChanges, PatchNotes } from "#/types";
import { formatPatchDate } from "#/utils/common-utils";

type ChangesPayload = {
	items: ItemChanges;
	heroes: ChangedHero[];
	notes: PatchNotes;
};

// Return type is explicit: without it the server-fn boundary widens the loader
// data to `any` and every downstream callback loses its types.
//
// There was a `setResponseHeader("Cache-Control", …)` call here, but
// @tanstack/react-start 1.166 exports no such function - it resolved to
// `undefined` and threw on every render, so SSR fell back to a client render
// via the error boundary and no header was ever set. Caching needs
// reimplementing against this version's API.
const fetchChanges = createServerFn({ method: "GET" }).handler(
	async (): Promise<ChangesPayload> => ({
		items: getItemChanges(),
		heroes: getChangedHeroes(),
		notes: getPatchNotes(),
	}),
);

export const Route = createFileRoute("/")({
	head: ({ loaderData }: { loaderData?: ChangesPayload }) => {
		const patchTitle =
			loaderData?.notes?.balance?.title || "Latest Valve Deadlock Patch";
		const heroCount = loaderData?.heroes?.length ?? 0;
		const itemCount =
			(loaderData?.items?.added?.length ?? 0) +
			(loaderData?.items?.removed?.length ?? 0) +
			(loaderData?.items?.changed?.length ?? 0);

		const title = `Deadlock Patch Notes (${patchTitle}) — ${heroCount} Heroes, ${itemCount} Items Changed | Deadlock Patch Comparator`;
		const description = `Interactive visual breakdown of ${patchTitle}. Compare stat changes, ability upgrades, and item buffs/nerfs across ${heroCount} heroes and ${itemCount} items in Deadlock.`;

		return {
			meta: [
				{ title },
				{ name: "description", content: description },
				{
					name: "robots",
					content:
						"index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
				},
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
				{ property: "og:url", content: "https://deadlockpatch.com/" },
				{ name: "twitter:title", content: title },
				{ name: "twitter:description", content: description },
			],
			links: [{ rel: "canonical", href: "https://deadlockpatch.com/" }],
		};
	},
	loader: async () => fetchChanges(),
	component: Changes,
});

function EmptyState({ children }: { children: React.ReactNode }) {
	return (
		<p className="rounded-md border border-white/10 border-dashed px-4 py-8 text-center text-gray-400">
			{children}
		</p>
	);
}

function SectionHeading({
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

function Changes() {
	// Annotated rather than inferred. routeTree.gen.ts imports this module and
	// augments the router module with it, while `useLoaderData()` resolves its
	// type back out of that same augmentation - a cycle TypeScript gives up on,
	// yielding `any`. The annotation is still checked against the real type if
	// the cycle ever resolves, so this is not a cast.
	const { items, heroes, notes }: ChangesPayload = Route.useLoaderData();
	const { added, removed, changed } = items;
	const itemCount = added.length + removed.length + changed.length;

	// The item/hero diff and the general notes can come from different updates -
	// a rework changes no items, a balance patch carries no general text - so the
	// blocks are ordered by their own dates, newest first. When both come from
	// the same note the dates tie and the original Items -> Heroes -> General
	// order is preserved, since sort() is stable.
	const balanceDate = notes.balance?.pubDate;
	const generalDate = notes.general?.pubDate;
	const blocks = [
		{ id: "items", date: balanceDate },
		{ id: "heroes", date: balanceDate },
		{ id: "general", date: generalDate },
	].sort((a, b) => Date.parse(b.date ?? "") - Date.parse(a.date ?? "") || 0);

	const itemsBlock = (
		<section id="items" className="mb-12">
			{added.length > 0 && (
				<div className="mb-10">
					<SectionHeading count={added.length}>Added items</SectionHeading>
					<div className="masonary">
						{added.map((item) => (
							<ItemCard item={item} isNew key={item.id} />
						))}
					</div>
				</div>
			)}

			{removed.length > 0 && (
				<div className="mb-10">
					<SectionHeading count={removed.length}>Removed items</SectionHeading>
					<div className="masonary">
						{removed.map((item) => (
							<ItemCard item={item} isRemoved key={item.id} />
						))}
					</div>
				</div>
			)}

			<SectionHeading count={changed.length} source={notes.balance}>
				Item changes
			</SectionHeading>
			{changed.length === 0 ? (
				<EmptyState>No item changes in this patch.</EmptyState>
			) : (
				<div className="masonary">
					{changed.map(({ item, changes }) => (
						<ItemCard item={item} changes={changes} key={item.id} />
					))}
				</div>
			)}
		</section>
	);

	const heroesBlock = (
		<section id="heroes" className="mb-12">
			<SectionHeading count={heroes.length} source={notes.balance}>
				Hero changes
			</SectionHeading>
			{heroes.length === 0 ? (
				<EmptyState>No hero changes in this patch.</EmptyState>
			) : (
				<>
					<HeroLegend />
					<div className="masonary">
						{heroes.map((changed) => (
							<HeroCard key={changed.hero.id} {...changed} />
						))}
					</div>
				</>
			)}
		</section>
	);

	const generalBlock = (
		<section id="general" className="mb-12">
			{/* Item and hero sections are stripped at ingest - they are already
			    rendered as diff cards above, and duplicating them as raw text was
			    the whole reason for this split. */}
			<SectionHeading source={notes.general}>General</SectionHeading>
			{notes.general ? (
				<article className="prose prose-invert max-w-none">
					<p className="text-gray-400 text-sm">
						<span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
							{notes.general.source}
						</span>
					</p>
					{/* Sanitized at ingest by app/utils/sanitizeHtml.ts. */}
					<div
						// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized at ingest
						dangerouslySetInnerHTML={{ __html: notes.general.html }}
					/>
					<a href={notes.general.link} target="_blank" rel="noreferrer">
						View original
					</a>
				</article>
			) : (
				<EmptyState>No general changes in this patch.</EmptyState>
			)}

			{notes.recent.length > 1 && (
				<div className="mt-8">
					<h3 className="mb-2 font-bold">Earlier notes</h3>
					<ul className="flex flex-col gap-1 text-sm">
						{notes.recent.slice(1).map(
							(note) =>
								note && (
									<li key={note.link}>
										<a
											className="text-gray-300 underline hover:text-white"
											href={note.link}
											target="_blank"
											rel="noreferrer"
										>
											{note.title}
										</a>{" "}
										<span className="text-gray-500">
											{formatPatchDate(note.pubDate)}
										</span>
									</li>
								),
						)}
					</ul>
				</div>
			)}
		</section>
	);

	const byId: Record<string, React.ReactNode> = {
		items: itemsBlock,
		heroes: heroesBlock,
		general: generalBlock,
	};

	return (
		<>
			<SectionNav counts={{ items: itemCount, heroes: heroes.length }} />

			<main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
				<Legend />
				{blocks.map((block) => (
					<Fragment key={block.id}>{byId[block.id]}</Fragment>
				))}
			</main>
		</>
	);
}
