/** A dashed placeholder box for a section with nothing to show yet. */
export default function EmptyState({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<p className="rounded-md border border-white/10 border-dashed px-4 py-8 text-center text-gray-400">
			{children}
		</p>
	);
}
