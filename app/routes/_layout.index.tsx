import { createFileRoute } from "@tanstack/react-router";
import Changes from "#/pages/patch-notes";
import { type ChangesPayload, fetchChanges } from "#/pages/patch-notes/server";

export const Route = createFileRoute("/_layout/")({
	head: ({ loaderData }: { loaderData?: ChangesPayload }) => {
		const patchTitle =
			loaderData?.notes?.balance?.title || "Latest Valve Deadlock Patch";
		const heroCount = loaderData?.heroes?.length ?? 0;
		const itemCount =
			(loaderData?.items?.added?.length ?? 0) +
			(loaderData?.items?.removed?.length ?? 0) +
			(loaderData?.items?.changed?.length ?? 0);

		const title = `Deadlock Patch Notes (${patchTitle}) — ${heroCount} Heroes, ${itemCount} Items Changed | Deadlock Patch Comparator`;
		const description = `Interactive visual breakdown of ${patchTitle}, the latest Deadlock update. Compare stat changes, ability upgrades, and item buffs/nerfs across ${heroCount} heroes and ${itemCount} items in this Deadlock patch visualizer.`;

		return {
			meta: [
				{ title },
				{ name: "description", content: description },
				{
					name: "robots",
					content:
						"index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
				},
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
				{ property: "og:url", content: "https://deadlockpatch.vercel.app/" },
				{ name: "twitter:title", content: title },
				{ name: "twitter:description", content: description },
			],
			links: [{ rel: "canonical", href: "https://deadlockpatch.vercel.app/" }],
		};
	},
	loader: async () => fetchChanges(),
	component: RouteComponent,
});

function RouteComponent() {
	// Annotated rather than inferred. routeTree.gen.ts imports this module and
	// augments the router module with it, while `useLoaderData()` resolves its
	// type back out of that same augmentation - a cycle TypeScript gives up on,
	// yielding `any`. The annotation is still checked against the real type if
	// the cycle ever resolves, so this is not a cast.
	const data: ChangesPayload = Route.useLoaderData();
	return <Changes {...data} />;
}
