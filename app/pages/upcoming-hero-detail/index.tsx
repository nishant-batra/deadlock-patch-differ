import { Link } from "@tanstack/react-router";
import CutFrame from "#/shared/components/cut-frame";
import { accentOf, textOn } from "#/shared/utils/heroAccent";
import type { Hero } from "#/types";

/**
 * `/heroes/$heroSlug` for an announced hero. Only the real data is shown -
 * portrait, name logo, theme colour, tags. Once the API marks the hero live,
 * the same URL renders the full `HeroDetail` instead; nothing here needs to
 * change.
 */
export default function UpcomingHeroDetail({ hero }: { hero: Hero }) {
	const { name, tags, images } = hero;
	const accent = accentOf(hero);
	const portrait =
		images?.top_bar_vertical_image_webp ?? images?.top_bar_vertical_image;

	return (
		<main className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
			<p className="mb-4 text-gray-400 text-sm">
				<Link to="/heroes" className="underline hover:text-white">
					Heroes
				</Link>{" "}
				/ <span className="text-gray-100">{name}</span>
			</p>

			<header className="mb-8 flex flex-wrap items-center gap-6">
				{portrait && (
					<CutFrame color={accent} width={2}>
						<img
							src={portrait}
							alt={name}
							width={120}
							height={200}
							className="cut-double"
							style={{ background: accent }}
						/>
					</CutFrame>
				)}
				<div className="flex min-w-0 flex-col gap-3">
					<span
						className="cut-corner self-start px-2.5 py-1 font-bold text-xs uppercase tracking-widest"
						style={{ background: accent, color: textOn(accent) }}
					>
						Coming soon
					</span>
					<h1 className="font-extrabold text-3xl">{name}</h1>
					{tags && tags.length > 0 && (
						<ul className="flex flex-wrap gap-1.5 text-gray-200 text-sm">
							{tags.map((tag) => (
								<li key={tag} className="rounded bg-white/10 px-2 py-0.5">
									{tag}
								</li>
							))}
						</ul>
					)}
				</div>
			</header>

			<p className="rounded-md border border-white/10 border-dashed px-4 py-8 text-center text-gray-400">
				{name} has been announced but is not playable yet. Starting stats,
				level-up growth and abilities will appear on this page as soon as {name}{" "}
				is released.
			</p>
		</main>
	);
}
