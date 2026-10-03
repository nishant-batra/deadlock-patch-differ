import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import HeroAvatar from "#/shared/components/hero-avatar";
import { heroSlug } from "#/shared/utils/heroSlug";
import type { Hero } from "#/types";
import Name from "./name";
import ViewHeroCta from "./view-hero-cta";

/**
 * The whole header is one link to the hero's page. By default it shows the
 * avatar, name and "View hero" CTA; `children` replace all of that, so a card
 * composes exactly the parts it wants (`HeroCard.Name`, `HeroCard.Cta`, ...).
 */
export default function Header({
	hero,
	children,
}: {
	hero: Hero;
	children?: ReactNode;
}) {
	return (
		<header>
			<Link
				to="/heroes/$heroSlug"
				params={{ heroSlug: heroSlug(hero.name) }}
				className="group flex items-center gap-3 bg-[#2a2a36] p-2.5 hover:bg-[#32323f]"
			>
				{children ?? (
					<>
						<HeroAvatar
							hero={hero}
							className="cut-double [--cut:var(--cut-md)]"
						/>
						<Name name={hero.name} />
						<ViewHeroCta />
					</>
				)}
			</Link>
		</header>
	);
}
