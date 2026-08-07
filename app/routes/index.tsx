import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import Card from "#/components/card";
import HeroCard from "#/components/HeroCard";
import SectionNav, { Badge } from "#/components/SectionNav";
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
}: {
	children: React.ReactNode;
	count?: number;
}) {
	return (
		<h2 className="mb-4 flex items-center gap-2 font-bold text-xl">
			{children}
			{count !== undefined && <Badge>{count}</Badge>}
		</h2>
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

	return (
		<>
			<SectionNav counts={{ items: itemCount, heroes: heroes.length }} />

			<div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
				{/* Added and removed come first, and only when non-empty. */}
				<section id="items" className="mb-12">
					{added.length > 0 && (
						<div className="mb-10">
							<SectionHeading count={added.length}>Added items</SectionHeading>
							<div className="masonary">
								{added.map((item) => (
									<Card item={item} isNew key={item.id} />
								))}
							</div>
						</div>
					)}

					{removed.length > 0 && (
						<div className="mb-10">
							<SectionHeading count={removed.length}>
								Removed items
							</SectionHeading>
							<div className="masonary">
								{removed.map((item) => (
									<Card item={item} isRemoved key={item.id} />
								))}
							</div>
						</div>
					)}

					<SectionHeading count={changed.length}>Item changes</SectionHeading>
					{changed.length === 0 ? (
						<EmptyState>No item changes in this patch.</EmptyState>
					) : (
						<div className="masonary">
							{changed.map(({ item, changes }) => (
								<Card item={item} changes={changes} key={item.id} />
							))}
						</div>
					)}
				</section>

				<section id="heroes" className="mb-12">
					<SectionHeading count={heroes.length}>Hero changes</SectionHeading>
					{heroes.length === 0 ? (
						<EmptyState>No hero changes in this patch.</EmptyState>
					) : (
						<div className="masonary">
							{heroes.map((changed) => (
								<HeroCard key={changed.hero.id} {...changed} />
							))}
						</div>
					)}
				</section>

				<section id="general" className="mb-12">
					<SectionHeading>General</SectionHeading>
					{notes.primary ? (
						<article className="prose prose-invert max-w-none">
							<h3>{notes.primary.title}</h3>
							<p className="text-gray-400 text-sm">
								{/* Finding #4: the note's own date, never the build's. */}
								{formatPatchDate(notes.primary.pubDate)}{" "}
								<span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
									{notes.primary.source}
								</span>
							</p>
							{/* Sanitized at ingest by app/utils/sanitizeHtml.ts. */}
							<div
								// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized at ingest
								dangerouslySetInnerHTML={{ __html: notes.primary.html }}
							/>
							<a href={notes.primary.link} target="_blank" rel="noreferrer">
								View original
							</a>
						</article>
					) : (
						<EmptyState>No patch notes found for this build.</EmptyState>
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
			</div>
		</>
	);
}
