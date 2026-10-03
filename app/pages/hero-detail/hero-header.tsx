import CutFrame from "#/shared/components/cut-frame";
import { accentOf } from "#/shared/components/upcoming-heroes/utils";
import type { Hero } from "#/types";
import HeroPortrait from "./hero-portrait";

/** Highest `complexity` in the catalog (Sinclair); everyone else is 1-3. */
const COMPLEXITY_MAX = 4;

/**
 * Portrait framed in the hero's own theme colour, name, one-line role, and
 * chips for the personality tags, gun archetype and complexity.
 */
export default function HeroHeader({
	hero,
	role,
}: {
	hero: Hero;
	role?: string;
}) {
	const { name, tags = [], gun_tag, complexity } = hero;
	const accent = accentOf(hero);

	return (
		<header className="mb-6 flex flex-wrap items-center gap-4">
			<CutFrame color={accent} width={2}>
				<HeroPortrait hero={hero} />
			</CutFrame>
			<div className="flex min-w-0 flex-col gap-2">
				<h1 className="font-extrabold text-3xl">{name}</h1>
				{role && <p className="text-gray-300 italic">{role}</p>}
				<ul className="flex flex-wrap items-center gap-1.5 text-gray-200 text-sm">
					{tags.map((tag) => (
						<li key={tag} className="rounded bg-white/10 px-2 py-0.5">
							{tag}
						</li>
					))}
					{gun_tag && (
						<li
							className="rounded px-2 py-0.5"
							style={{ boxShadow: `inset 0 0 0 1px ${accent}` }}
						>
							{gun_tag}
						</li>
					)}
					{complexity !== undefined && (
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
				</ul>
			</div>
		</header>
	);
}
