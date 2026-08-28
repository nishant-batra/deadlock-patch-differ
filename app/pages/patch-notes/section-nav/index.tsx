/**
 * Plain anchors, deliberately - no scroll-spy, no JS. `scroll-margin-top` in
 * app.css keeps the target heading clear of this bar.
 */
export default function SectionNav({
	counts,
}: {
	counts: { items: number; heroes: number };
}) {
	return (
		<nav className="sticky top-0  flex gap-4 z-1 border-white/10 border-b bg-[#0e0e13]/95 px-4 py-3 backdrop-blur sm:px-8">
			<a className="flex items-center gap-2 hover:text-white" href="#items">
				Items <Badge>{counts.items}</Badge>
			</a>
			<a className="flex items-center gap-2 hover:text-white" href="#heroes">
				Heroes <Badge>{counts.heroes}</Badge>
			</a>
			<a className="hover:text-white" href="#general">
				General
			</a>
		</nav>
	);
}

export function Badge({ children }: { children: React.ReactNode }) {
	return (
		<span className="rounded-full bg-white/10 px-2 py-0.5 font-medium text-xs">
			{children}
		</span>
	);
}
