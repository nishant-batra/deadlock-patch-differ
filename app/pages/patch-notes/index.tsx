import { Link } from "@tanstack/react-router";
import { Fragment } from "react";
import AdSlot from "#/shared/components/ad-slot";
import Badge from "#/shared/components/badge";
import CardLegend from "#/shared/components/card-legend";
import CutFrame from "#/shared/components/cut-frame";
import { AMBER_BORDER } from "#/shared/components/cut-frame/constants";
import ItemCard from "#/shared/components/item-card";
import UpcomingHeroes from "#/shared/components/upcoming-heroes";
import { formatPatchDate } from "#/shared/utils/formatPatchDate";
import HeroCard from "./hero-card";
import HeroLegend from "./hero-legend";
import type { ChangesPayload } from "./server";

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

export default function Changes({
	items,
	heroes,
	upcomingHeroes,
	notes,
}: ChangesPayload) {
	const { added, removed, changed } = items;
	const { balance, general, recent } = notes;

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
			<SectionHeading source={general}>General</SectionHeading>
			{general ? (
				<article className="prose prose-invert max-w-none">
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
		<main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
			<h1 className="mb-1 font-extrabold text-2xl">
				Deadlock Patch Notes &amp; Update Visualizer
			</h1>
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<p className="text-gray-400 text-sm">
					See exactly what changed in the latest Deadlock update — hero stat
					changes, item buffs and nerfs, and full patch notes, visualized side
					by side.
				</p>
				<CutFrame color={AMBER_BORDER}>
					<Link
						to="/compare"
						search={{ heroes: [] }}
						className="cut-corner px-3 py-1.5 font-bold"
					>
						Compare heroes
					</Link>
				</CutFrame>
			</div>
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
			{blocks.map(({ id }, index) => (
				<Fragment key={id}>
					{byId[id]}
					{index < blocks.length - 1 && (
						<AdSlot
							slotId={`TODO-ad-unit-in-content-${index + 1}`}
							className="mb-12"
						/>
					)}
				</Fragment>
			))}
		</main>
	);
}
