import clsx from "clsx";
import type { ReactNode } from "react";
import CutFrame from "#/shared/components/cut-frame";
import { colorsFor, itemTypes } from "#/shared/components/item-card/constants";
import { useActiveSlot } from "./useActiveSlot";

/**
 * Sticky Weapon / Spirit / Vitality switch - plain `#slot` anchors, so the
 * browser does the jump (smooth via `scroll-behavior` on `html`, offset by
 * each section's `scroll-margin-top`). The section currently in view is
 * filled with its slot colour.
 *
 * Plain anchors, not router `Link`s: `Link` stamps `aria-current="page"` on
 * all three, since they share the `/items` path.
 *
 * `children` sit at the end of the bar (the item search).
 */
export default function SlotSwitch({ children }: { children?: ReactNode }) {
	const { barRef, active, select } = useActiveSlot();

	return (
		// Page-coloured so cards scrolling up are hidden behind the bar.
		<div
			ref={barRef}
			className="sticky top-(--nav-height) z-10 mb-2 flex flex-wrap gap-2 bg-[#0e0e13] py-3"
		>
			{itemTypes.map((type) => {
				const { primary } = colorsFor(type);
				const isActive = type === active;
				return (
					<CutFrame key={type} color={primary} width={isActive ? 2 : 1}>
						<a
							href={`#${type}`}
							// The browser still does the jump; this only lights the tab now.
							onClick={() => select(type)}
							aria-current={isActive ? "true" : undefined}
							className={clsx(
								"cut-corner px-3 py-1.5 capitalize",
								isActive && "font-bold",
							)}
							style={isActive ? { background: primary } : undefined}
						>
							{type}
						</a>
					</CutFrame>
				);
			})}
			{children}
		</div>
	);
}
