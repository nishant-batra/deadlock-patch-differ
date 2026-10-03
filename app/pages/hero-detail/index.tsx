import { Link } from "@tanstack/react-router";
import CutFrame from "#/shared/components/cut-frame";
import { AMBER_BORDER } from "#/shared/components/cut-frame/constants";
import HeroBreadcrumb from "#/shared/components/hero-breadcrumb";
import HeroHeader from "#/shared/components/hero-header";
import type {
	HeroDescription,
	HeroEntry,
	HeroWeapon as HeroWeaponData,
} from "#/types";
import HeroAbilities from "./hero-abilities";
import HeroAbout from "./hero-about";
import HeroLevelUp from "./hero-level-up";
import HeroScaling from "./hero-scaling";
import HeroStats from "./hero-stats";
import HeroWeapon from "./hero-weapon";

export default function HeroDetail({
	hero,
	abilities,
	weapon,
	description,
}: HeroEntry & { weapon?: HeroWeaponData; description?: HeroDescription }) {
	return (
		<main className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
			<HeroBreadcrumb name={hero.name} />

			<HeroHeader hero={hero} role={description?.role} />

			{description && <HeroAbout description={description} />}

			<section className="mb-8">
				<h2 className="mb-2 font-bold text-xl">Starting Stats</h2>
				<HeroStats hero={hero} />
			</section>

			{weapon && (
				<section className="mb-8">
					<h2 className="mb-2 font-bold text-xl">Weapon</h2>
					<HeroWeapon weapon={weapon} />
				</section>
			)}

			<HeroScaling scalingStats={hero.scaling_stats} />

			<section className="mb-8">
				<h2 className="mb-2 font-bold text-xl">Level-Up Growth</h2>
				<HeroLevelUp hero={hero} />
			</section>

			<section className="mb-8">
				<h2 className="mb-2 font-bold text-xl">Abilities</h2>
				<HeroAbilities abilities={abilities} />
			</section>

			<div className="mt-8 text-center">
				<CutFrame color={AMBER_BORDER}>
					<Link
						to="/compare"
						search={{ heroes: [hero.class_name] }}
						className="cut-corner px-3 py-1.5 font-bold"
					>
						Compare {hero.name} with another hero →
					</Link>
				</CutFrame>
			</div>
		</main>
	);
}
