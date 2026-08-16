import AbilityRow from "#/components/ability-row";
import HeroAvatar from "#/components/hero-avatar";
import type { HeroEntry } from "#/types";
import { labelForStatKey } from "#/utils/statLabels";
import { PRIMARY_STATS } from "./constants";
import StatRow from "./stat-row";
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
}: HeroEntry & { expandAll: boolean }) {
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
		<article className="m-3 flex min-w-80 max-w-100 flex-col rounded-md bg-[#1b1b24]">
			<header className="flex items-center gap-3 bg-[#2a2a36] p-2.5">
				<HeroAvatar hero={hero} />
				<h3 className="font-extrabold text-lg">{hero.name}</h3>
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
	);
}
