import { Link } from "@tanstack/react-router";
import AbilityRow from "#/shared/components/ability-row";
import CutFrame from "#/shared/components/cut-frame";
import { AMBER_BORDER } from "#/shared/components/cut-frame/constants";
import HeroAvatar from "#/shared/components/hero-avatar";
import StatRow from "#/shared/components/hero-stat-row";
import { PRIMARY_STATS } from "#/shared/components/hero-stat-row/constants";
import { heroSlug } from "#/shared/utils/heroSlug";
import { labelForStatKey } from "#/shared/utils/statLabels";
import type { HeroEntry } from "#/types";
import { useExpandable } from "./useExpandable";

const isPrimary = (key: string): key is (typeof PRIMARY_STATS)[number] =>
	(PRIMARY_STATS as readonly string[]).includes(key);

/**
 * A hero's own profile - no patch, no deltas. Unlike `HeroCard` (which shows
 * only what moved this patch), this shows what the hero currently has:
 * curated stats up top, the rest behind "All stats", then the same ability
 * row `HeroCard` uses (tiers render the hero's real upgrades, with
 * `equal` rows since nothing is being diffed).
 */
export default function HeroProfileCard({
	hero,
	abilities,
	expandAll,
	isChanged = false,
}: HeroEntry & { expandAll: boolean; isChanged?: boolean }) {
	const [open, setOpen] = useExpandable(expandAll);

	const primaryRows = PRIMARY_STATS.flatMap((key) => {
		const stat = hero.starting_stats[key];
		return stat
			? [{ key, label: labelForStatKey(key), value: stat.value }]
			: [];
	});
	const otherStatRows = Object.entries(hero.starting_stats)
		.filter(([key]) => !isPrimary(key))
		.map(([key, stat]) => ({
			key,
			label: labelForStatKey(key),
			value: stat.value,
		}));
	// Finding K: standard_level_up_upgrades is full of zero-valued entries a
	// hero simply doesn't use - shown, every card would carry dead rows.
	const levelUpRows = Object.entries(hero.standard_level_up_upgrades)
		.filter(([, value]) => value !== 0)
		.map(([key, value]) => ({ key, label: labelForStatKey(key), value }));

	return (
		<CutFrame
			color={AMBER_BORDER}
			width={isChanged ? 2 : 0}
			className="m-3 flex min-w-80 max-w-100"
		>
			<article className="cut-double flex flex-1 flex-col bg-[#1b1b24]">
				{isChanged && (
					<div className="cut-corner bg-amber-500/25 px-2.5 py-1 text-center font-bold text-[11px] text-amber-200 uppercase tracking-widest">
						Changed this patch
					</div>
				)}
				<header className="flex items-center justify-between gap-3 bg-[#2a2a36] p-2.5">
					<div className="flex items-center gap-3">
						<HeroAvatar
							hero={hero}
							className="cut-double [--cut:var(--cut-md)]"
						/>
						<h3 className="font-extrabold text-lg">{hero.name}</h3>
					</div>
					<CutFrame
						color={AMBER_BORDER}
						cut="5px"
						className="inline-flex shrink-0"
					>
						<Link
							to="/heroes/$heroSlug"
							params={{ heroSlug: heroSlug(hero.name) }}
							className="cut-corner py-1.5 pr-4 pl-2.5 font-bold text-xs"
						>
							View hero →
						</Link>
					</CutFrame>
				</header>

				<div className="flex flex-col gap-0.5 bg-[#22222c] py-1">
					{primaryRows.map((row) => (
						<StatRow key={row.key} label={row.label} value={row.value} />
					))}
				</div>

				<details
					open={open}
					onToggle={(event) => setOpen(event.currentTarget.open)}
					className="px-2.5 py-1.5"
				>
					<summary className="cursor-pointer select-none text-gray-400 text-xs">
						All stats
					</summary>
					<div className="mt-1 flex flex-col gap-0.5">
						{[...otherStatRows, ...levelUpRows].map((row) => (
							<StatRow key={row.key} label={row.label} value={row.value} />
						))}
					</div>
				</details>

				<AbilityRow abilities={abilities} />
			</article>
		</CutFrame>
	);
}
