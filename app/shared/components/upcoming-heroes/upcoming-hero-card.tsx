import { Link } from "@tanstack/react-router";
import CutFrame from "#/shared/components/cut-frame";
import { accentOf, textOn } from "#/shared/utils/heroAccent";
import { heroSlug } from "#/shared/utils/heroSlug";
import type { Hero } from "#/types";

/**
 * An announced hero: portrait, name, and the three personality tags - the
 * only real data the API ships for them. Stats, weapon and complexity are
 * placeholders until release, so they are deliberately not shown.
 */
export default function UpcomingHeroCard({ hero }: { hero: Hero }) {
	const { name, tags, images } = hero;
	const accent = accentOf(hero);
	const portrait =
		images?.top_bar_vertical_image_webp ?? images?.top_bar_vertical_image;

	return (
		<CutFrame color={accent} width={2} className="flex min-w-0 flex-1">
			<Link
				to="/heroes/$heroSlug"
				params={{ heroSlug: heroSlug(name) }}
				className="cut-double flex flex-1 items-center gap-3 bg-[#1b1b24] p-2.5 hover:bg-[#22222c]"
			>
				{portrait && (
					<img
						src={portrait}
						alt=""
						width={60}
						height={100}
						loading="lazy"
						className="cut-double shrink-0 [--cut:var(--cut-sm)]"
						style={{ background: accent }}
					/>
				)}
				<div className="flex min-w-0 flex-col gap-1.5">
					<span
						className="cut-corner self-start px-2 py-0.5 font-bold text-[11px] uppercase tracking-widest"
						style={{ background: accent, color: textOn(accent) }}
					>
						Coming soon
					</span>
					<h3 className="font-extrabold text-lg leading-tight">{name}</h3>
					{tags && tags.length > 0 && (
						<ul className="flex flex-wrap gap-1 text-gray-300 text-xs">
							{tags.map((tag) => (
								<li key={tag} className="rounded bg-white/10 px-1.5 py-0.5">
									{tag}
								</li>
							))}
						</ul>
					)}
				</div>
			</Link>
		</CutFrame>
	);
}
