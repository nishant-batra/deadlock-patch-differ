import { Link } from "@tanstack/react-router";

/** "Heroes / Name" trail at the top of a hero page. */
export default function HeroBreadcrumb({ name }: { name: string }) {
	return (
		<p className="mb-4 text-gray-400 text-sm">
			<Link to="/heroes" className="underline hover:text-white">
				Heroes
			</Link>{" "}
			/ <span className="text-gray-100">{name}</span>
		</p>
	);
}
