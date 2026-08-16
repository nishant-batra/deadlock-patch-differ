import { ArrowUp } from "lucide-react";
import { useScrollToTop } from "./useScrollToTop";

export default function ScrollToTop() {
	const { isVisible, sentinelRef, scrollToTop } = useScrollToTop();

	return (
		<>
			{/* Sentinel element placed at the top 200px of the page to detect scroll */}
			<div
				ref={sentinelRef}
				className="pointer-events-none absolute top-0 left-0 -z-50 h-[200px] w-full"
				aria-hidden="true"
			/>

			{/* Floating scroll to top button */}
			<button
				type="button"
				onClick={scrollToTop}
				aria-label="Scroll to top"
				className={`fixed right-6 bottom-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-neutral-900/90 text-white shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-amber-500/60 hover:bg-amber-500/20 hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95 ${
					isVisible
						? "translate-y-0 opacity-100"
						: "pointer-events-none translate-y-4 opacity-0"
				}`}
			>
				<ArrowUp className="h-5 w-5" />
			</button>
		</>
	);
}
