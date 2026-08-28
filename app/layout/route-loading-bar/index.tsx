import { useIsRouteLoading } from "./useIsRouteLoading";

export default function RouteLoadingBar() {
	const isLoading = useIsRouteLoading();

	return (
		<div
			className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] w-full overflow-hidden bg-white/5 transition-opacity duration-200 ${
				isLoading ? "opacity-100" : "opacity-0"
			}`}
			aria-hidden="true"
		>
			<div className="route-loading-bar-fill h-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
		</div>
	);
}
