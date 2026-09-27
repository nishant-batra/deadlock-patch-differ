export default function Badge({ children }: { children: React.ReactNode }) {
	return (
		<span className="cut-corner bg-white/10 px-2 py-0.5 font-medium text-xs">
			{children}
		</span>
	);
}
