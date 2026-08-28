export default function Swatch({
	children,
	caption,
}: {
	children: React.ReactNode;
	caption: string;
}) {
	return (
		<div className="flex flex-col gap-1 rounded-md bg-white/5 p-3">
			<div className="rounded-sm bg-black/20">{children}</div>
			<span className="text-gray-400 text-xs">{caption}</span>
		</div>
	);
}
