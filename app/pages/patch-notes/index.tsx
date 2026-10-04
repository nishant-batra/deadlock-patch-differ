import { Fragment } from "react";
import CardLegend from "#/shared/components/card-legend";
import EmptyState from "#/shared/components/empty-state";
import ItemCard from "#/shared/components/item-card";
import UpcomingHeroes from "#/shared/components/upcoming-heroes";
import { formatPatchDate } from "#/shared/utils/formatPatchDate";
import ChangedHeroCard from "./hero-card";
import HeroLegend from "./hero-legend";
import SectionHeading from "./section-heading";
import type { ChangesPayload } from "./server";
import { latestNoteDate } from "./utils";

export default function Changes({
	items,
	heroes,
	upcomingHeroes,
	notes,
}: ChangesPayload) {
	const { added, removed, changed } = items;
	const { balance, general, recent } = notes;
	const patchDate = latestNoteDate(notes);

	// The item/hero diff and the general notes can come from different updates -
	// a rework changes no items, a balance patch carries no general text - so the
	// blocks are ordered by their own dates, newest first. When both come from
	// the same note the dates tie and the original Items -> Heroes -> General
	// order is preserved, since sort() is stable.
	const balanceDate = balance?.pubDate;
	const generalDate = general?.pubDate;
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

			<SectionHeading count={changed.length} source={balance}>
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
			<SectionHeading count={heroes.length} source={balance}>
				Hero changes
			</SectionHeading>
			{heroes.length === 0 ? (
				<EmptyState>No hero changes in this patch.</EmptyState>
			) : (
				<>
					<HeroLegend />
					<div className="masonary">
						{heroes.map((changed) => (
							<ChangedHeroCard key={changed.hero.id} {...changed} />
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
			<SectionHeading source={general}>General</SectionHeading>
			{general ? (
				<article className="prose prose-invert max-w-none [overflow-wrap:anywhere]">
					<p className="text-gray-400 text-sm">
						<span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
							{general.source}
						</span>
					</p>
					{/* Sanitized at ingest by app/lib/sanitizeHtml.ts. */}
					<div
						// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized at ingest
						dangerouslySetInnerHTML={{ __html: general.html }}
					/>
					<a href={general.link} target="_blank" rel="noreferrer">
						View original
					</a>
				</article>
			) : (
				<EmptyState>No general changes in this patch.</EmptyState>
			)}

			{recent.length > 1 && (
				<div className="mt-8">
					<h3 className="mb-2 font-bold">Earlier notes</h3>
					<ul className="flex flex-col gap-1 text-sm">
						{recent.slice(1).map(
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
										<span className="text-gray-400">
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
		<main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
			<h1 className="mb-1 font-extrabold text-2xl">
				Deadlock Patch Notes
				{patchDate && (
					<>
						{" "}
						&mdash;{" "}
						<time dateTime={patchDate}>{formatPatchDate(patchDate)}</time>
					</>
				)}
			</h1>
			<p className="mb-6 text-gray-400 text-sm">
				See exactly what changed in the latest Deadlock update — hero stat
				changes, item buffs and nerfs, and full patch notes, visualized side by
				side.
			</p>
			{/* Pinned above the dated blocks: announced heroes are the headline
			    of the patch that reveals them, and stay listed until release. */}
			{upcomingHeroes.length > 0 && (
				<section id="new-heroes" className="mb-12">
					<SectionHeading count={upcomingHeroes.length}>
						New heroes
					</SectionHeading>
					<UpcomingHeroes heroes={upcomingHeroes} />
				</section>
			)}
			<CardLegend />
			{blocks.map(({ id }) => (
				<Fragment key={id}>{byId[id]}</Fragment>
			))}
		</main>
	);
}
