import { isUpcomingHero } from "#/lib/roster";
import ComingSoonBadge from "#/shared/components/coming-soon-badge";
import CutFrame from "#/shared/components/cut-frame";
import HeroTags from "#/shared/components/hero-tags";
import { accentOf } from "#/shared/utils/heroAccent";
import { COMPLEXITY_MAX } from "#/shared/utils/heroDisplayRows";
import type { Hero } from "#/types";
import HeroPortrait from "./portrait";

/**
 * Portrait framed in the hero's own theme colour, name, one-line role, and
 * chips for the personality tags, gun archetype and complexity. An announced
 * hero gets a "Coming soon" badge instead of the gun and complexity chips -
 * those are placeholders until release.
 */
export default function HeroHeader({
	hero,
	role,
}: {
	hero: Hero;
	role?: string;
}) {
	const { name, tags, gun_tag, complexity } = hero;
	const accent = accentOf(hero);
	const upcoming = isUpcomingHero(hero);

	return (
		<header className="mb-6 flex flex-wrap items-center gap-4">
			<CutFrame color={accent} width={2}>
				<HeroPortrait hero={hero} accent={accent} />
			</CutFrame>
			<div className="flex min-w-0 flex-col gap-2">
				{upcoming && (
					<ComingSoonBadge accent={accent} className="px-2.5 py-1 text-xs" />
				)}
				<h1 className="font-extrabold text-3xl">{name}</h1>
				{role && <p className="text-gray-300 italic">{role}</p>}
				<HeroTags tags={tags} className="gap-1.5 text-gray-200 text-sm">
					{!upcoming && gun_tag && (
						<li
							className="rounded px-2 py-0.5"
							style={{ boxShadow: `inset 0 0 0 1px ${accent}` }}
						>
							{gun_tag}
						</li>
					)}
					{!upcoming && complexity !== undefined && (
						<li
							className="flex items-center gap-1.5 px-1 py-0.5 text-gray-400"
							title={`Complexity ${complexity} of ${COMPLEXITY_MAX}`}
						>
							Complexity
							<span className="flex gap-0.5" aria-hidden>
								{Array.from({ length: COMPLEXITY_MAX }, (_, index) => (
									<span
										// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length pip row
										key={index}
										className="size-2 rounded-full"
										style={{
											background:
												index < complexity ? accent : "rgb(255 255 255 / 0.15)",
										}}
									/>
								))}
							</span>
							<span className="sr-only">
								{complexity} of {COMPLEXITY_MAX}
							</span>
						</li>
					)}
				</HeroTags>
			</div>
		</header>
	);
}
