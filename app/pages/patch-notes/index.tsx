import EmptyState from "#/shared/components/empty-state";
import UpcomingHeroes from "#/shared/components/upcoming-heroes";
import { formatPatchDate } from "#/shared/utils/formatPatchDate";
import GeneralNote from "./general-note";
import HeroChanges from "./hero-changes";
import HotfixSection from "./hotfix-section";
import ItemChanges from "./item-changes";
import SectionBar from "./section-bar";
import SectionHeading from "./section-heading";
import type { ChangesPayload } from "./server";
import { BELOW_BAR, itemCount, latestNoteDate } from "./utils";

export default function Changes({
	patch,
	items,
	heroes,
	hotfix,
	upcomingHeroes,
	notes,
}: ChangesPayload) {
	const { balance, general, recent } = notes;
	const patchDate = latestNoteDate(notes, hotfix?.note);

	const itemsBlock = (
		<section id="items" className={`mb-12 ${BELOW_BAR}`}>
			<ItemChanges items={items} />
		</section>
	);

	const heroesBlock = (
		<section id="heroes" className={`mb-12 ${BELOW_BAR}`}>
			<HeroChanges heroes={heroes} legend={!hotfix?.heroes.length} />
		</section>
	);

	const generalBlock = (
		<section id="general" className={`mb-12 ${BELOW_BAR}`}>
			<SectionHeading as="h3" source={general}>
				General
			</SectionHeading>
			{general ? (
				<GeneralNote note={general} />
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
			{/* First: the newest changes, merged across every hotfix since the patch. */}
			<HotfixSection hotfix={hotfix} />
			<section id="patch">
				<SectionBar
					label="Patch"
					tone="patch"
					builds={patch ? [patch.build] : []}
					builtAt={patch?.builtAt}
					note={balance}
					links={[
						...(upcomingHeroes.length > 0
							? [
									{
										href: "#new-heroes",
										label: "New heroes",
										count: upcomingHeroes.length,
									},
								]
							: []),
						{ href: "#items", label: "Items", count: itemCount(items) },
						{ href: "#heroes", label: "Heroes", count: heroes.length },
						{ href: "#general", label: "General" },
					]}
				/>
				{/* Pinned first: announced heroes are the headline
				    of the patch that reveals them, and stay listed until release. */}
				{upcomingHeroes.length > 0 && (
					<section id="new-heroes" className={`mb-12 ${BELOW_BAR}`}>
						<SectionHeading as="h3" count={upcomingHeroes.length}>
							New heroes
						</SectionHeading>
						<UpcomingHeroes heroes={upcomingHeroes} />
					</section>
				)}
				{itemsBlock}
				{heroesBlock}
				{generalBlock}
			</section>
		</main>
	);
}
