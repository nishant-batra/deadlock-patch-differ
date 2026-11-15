import clsx from "clsx";
import { X } from "lucide-react";
import type { PopoverNav } from "./types";

/**
 * The strip above the ability card: which hero and which change this is, a
 * tappable stepper through the hero's changed abilities, and the close button.
 * Touch targets are at least 44px.
 */
export default function NavHeader({
	nav,
	statusId,
	onClose,
}: {
	nav?: PopoverNav;
	/** The dialog's `aria-describedby`, so the position is read out on focus. */
	statusId: string;
	onClose: () => void;
}) {
	const { hero, changes = [] } = nav ?? {};
	const current = changes.findIndex(({ current }) => current) + 1;

	return (
		<div className="flex shrink-0 flex-col border-[#2d4b43] border-b bg-[#191917]">
			{hero && (
				<p className="flex items-baseline gap-2 px-4 pt-2.5">
					<span className="truncate font-display text-[#f4ead6] text-lg">
						{hero.name}
					</span>
					<span className="whitespace-nowrap text-[#b8b3a7] text-[13px]">
						Hero {hero.position} of {hero.total}
					</span>
				</p>
			)}
			<div className="flex items-center gap-2 pl-4">
				{nav && (
					<>
						<p
							id={statusId}
							className="whitespace-nowrap font-bold text-amber-400 text-sm"
						>
							{hero && <span className="sr-only">{hero.name}, </span>}
							Change {current} of {changes.length}
						</p>
						<nav aria-label="Changed abilities" className="flex flex-1 gap-1">
							{changes.map(({ name, current, go }) => (
								<button
									key={name}
									type="button"
									aria-label={name}
									aria-current={current ? "step" : undefined}
									onClick={go}
									className="group flex h-11 flex-1 items-center"
								>
									<span
										className={clsx(
											"block w-full",
											current
												? "h-1.5 bg-amber-400"
												: "h-1 bg-[#5a574f] group-hover:bg-gray-400",
										)}
									/>
								</button>
							))}
						</nav>
					</>
				)}
				<button
					type="button"
					onClick={onClose}
					aria-label="Close"
					className="ml-auto flex size-12 shrink-0 items-center justify-center text-[#d9d5cc] hover:text-white"
				>
					<X size={24} aria-hidden />
				</button>
			</div>
		</div>
	);
}
