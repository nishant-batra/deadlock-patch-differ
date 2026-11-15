import type { AbilityChange } from "#/types";
import { abilityMarkers } from "./utils";

/** What changed on one ability, at a glance: ▲ buffs, ▼ nerfs, tiers, wording. */
export default function Marker({
	abilityChange,
}: {
	abilityChange: AbilityChange;
}) {
	const { buffs, nerfs, tiers, wording } = abilityMarkers(abilityChange);
	return (
		<span className="mt-1 flex w-12 flex-wrap justify-center gap-x-1 font-semibold text-[10px] leading-tight">
			{buffs > 0 && (
				<span className="text-emerald-300">
					<span aria-hidden>▲</span>
					<span className="sr-only">Buffs:</span>
					{buffs}
				</span>
			)}
			{nerfs > 0 && (
				<span className="text-rose-300">
					<span aria-hidden>▼</span>
					<span className="sr-only">Nerfs:</span>
					{nerfs}
				</span>
			)}
			{tiers.map((tier) => (
				<span key={tier} className="text-amber-300">
					T{tier}
				</span>
			))}
			{wording && <span className="text-gray-300">Wording</span>}
		</span>
	);
}
