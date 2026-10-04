import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "#/lib/patchNotification";
import Changes from "#/pages/patch-notes";
import { type ChangesPayload, fetchChanges } from "#/pages/patch-notes/server";
import { latestNoteDate } from "#/pages/patch-notes/utils";
import { formatPatchDate } from "#/shared/utils/formatPatchDate";
import { seoHead } from "#/shared/utils/seoHead";

export const Route = createFileRoute("/_layout/")({
	head: ({ loaderData }: { loaderData?: ChangesPayload }) => {
		const heroCount = loaderData?.heroes?.length ?? 0;
		const itemCount =
			(loaderData?.items?.added?.length ?? 0) +
			(loaderData?.items?.removed?.length ?? 0) +
			(loaderData?.items?.changed?.length ?? 0);
		const patchDate = loaderData && latestNoteDate(loaderData.notes);
		const dateLabel = patchDate ? formatPatchDate(patchDate) : undefined;

		// Date, not the note's flavour title ("Listen up, Crumbums!...") - the
		// date is what people search for, and this keeps the title under
		// Google's ~60 character cut-off.
		const title = `Deadlock Patch Notes – ${dateLabel ?? "Latest Update"} | Hero & Item Changes`;
		const description = `Everything that changed in the ${dateLabel ? `${dateLabel} ` : "latest "}Deadlock update: ${heroCount} heroes and ${itemCount} items, with stat changes, ability upgrades and item buffs/nerfs shown side by side.`;

		const head = seoHead({ title, description, path: "/" });
		if (!patchDate) return head;

		// Lets Google show the patch date next to the result.
		const publisher = {
			"@type": "Organization",
			name: "Deadlock Patch Comparator",
			url: SITE_URL,
		};
		return {
			...head,
			scripts: [
				{
					type: "application/ld+json",
					children: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "Article",
						headline: `Deadlock Patch Notes – ${dateLabel}`,
						description,
						image: `${SITE_URL}/og-image.webp`,
						datePublished: patchDate,
						dateModified: patchDate,
						mainEntityOfPage: `${SITE_URL}/`,
						author: publisher,
						publisher,
					}),
				},
			],
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
