// app/routes/__root.tsx
/// <reference types="vite/client" />
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import type { ReactNode } from "react";
import PatchHeader from "#/components/PatchHeader";
import { getPatchMeta } from "#/server/patchService";
import styles from "../styles/app.css?url";

const fetchPatchMeta = createServerFn({ method: "GET" }).handler(async () => {
	// Rebuilt by the deploy hook whenever new artifacts are committed.
	setResponseHeader("Cache-Control", "public, s-maxage=31536000, immutable");
	return getPatchMeta();
});

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Deadlock Patch Differ" },
			{
				name: "description",
				content:
					"What changed in the latest Deadlock patch: items, heroes and notes.",
			},
		],
		links: [{ rel: "stylesheet", href: styles }],
	}),
	loader: async () => fetchPatchMeta(),
	component: RootComponent,
});

function RootComponent() {
	const meta = Route.useLoaderData();
	return (
		<RootDocument>
			<PatchHeader meta={meta} />
			<Outlet />
		</RootDocument>
	);
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}
