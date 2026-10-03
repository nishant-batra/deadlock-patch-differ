// app/routes/__root.tsx
/// <reference types="vite/client" />
import {
	createRootRoute,
	HeadContent,
	Link,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import type { ReactNode } from "react";
import RouteLoadingBar from "#/layout/route-loading-bar";
import { SITE_URL } from "#/lib/patchNotification";
import { ADSENSE_PUBLISHER_ID } from "#/shared/components/ad-slot/constants";
import CutFrame from "#/shared/components/cut-frame";
import { AMBER_BORDER } from "#/shared/components/cut-frame/constants";
import styles from "../styles/app.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{
				title:
					"Deadlock Patch Comparator - Visual Patch Notes, Hero & Item Changes",
			},
			{
				name: "description",
				content:
					"Interactive visual breakdown of Valve's Deadlock patches. Track hero stat changes, ability upgrades, item buffs & nerfs, and patch notes in real time.",
			},
			{
				name: "keywords",
				content:
					"Deadlock patch notes, Deadlock changes, Deadlock buffs and nerfs, Deadlock hero stats, Deadlock item changes, Deadlock update tracker, Valve Deadlock, Deadlock patch visualizer, Deadlock update, Deadlock update visualizer, Deadlock hero comparison, Deadlock item stats, Deadlock all items, Deadlock all heroes",
			},
			{ name: "theme-color", content: "#090d16" },
			{
				name: "google-site-verification",
				content: "70a-hi7LXl9oYXXOugLieN1KF_AekN35jMWI73TkCoI",
			},
			{ property: "og:site_name", content: "Deadlock Patch Comparator" },
			{ property: "og:type", content: "website" },
			{ property: "og:locale", content: "en_US" },
			{
				property: "og:image",
				content: `${SITE_URL}/og-image.webp`,
			},
			{ property: "og:image:type", content: "image/webp" },
			{
				property: "og:image:alt",
				content: "Deadlock - Valve's hero shooter",
			},
			{ name: "twitter:card", content: "summary_large_image" },
			{
				name: "twitter:image",
				content: `${SITE_URL}/og-image.webp`,
			},
			{
				name: "twitter:image:alt",
				content: "Deadlock - Valve's hero shooter",
			},
		],
		links: [{ rel: "stylesheet", href: styles }],
		scripts: [
			...(ADSENSE_PUBLISHER_ID
				? [
						{
							src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`,
							async: true,
							crossOrigin: "anonymous" as const,
						},
					]
				: []),
			{
				type: "application/ld+json",
				children: JSON.stringify({
					"@context": "https://schema.org",
					"@type": "WebApplication",
					name: "Deadlock Patch Comparator",
					applicationCategory: "GameApplication",
					operatingSystem: "Web",
					description:
						"Interactive visual breakdown of Valve's Deadlock game patches, hero stat changes, ability upgrade tiers, and item buffs/nerfs.",
					offers: {
						"@type": "Offer",
						price: "0",
						priceCurrency: "USD",
					},
				}),
			},
		],
	}),
	component: RootComponent,
	// General fallback for any URL that matches no route at all. Individual
	// routes (e.g. `/heroes/$heroSlug`) can still define their own, more
	// specific `notFoundComponent` for a `notFound()` thrown from their own
	// loader - this one only catches what nothing more specific already did.
	notFoundComponent: () => (
		<main className="mx-auto max-w-7xl px-4 py-16 text-center">
			<h1 className="mb-2 font-extrabold text-2xl">Page not found</h1>
			<p className="mb-6 text-gray-400">
				That page doesn't exist. Try one of these instead.
			</p>
			<div className="flex flex-wrap justify-center gap-2">
				<CutFrame color={AMBER_BORDER}>
					<Link to="/" className="cut-corner px-3 py-1.5 font-bold">
						Patch notes
					</Link>
				</CutFrame>
				<CutFrame color={AMBER_BORDER}>
					<Link to="/heroes" className="cut-corner px-3 py-1.5 font-bold">
						Heroes
					</Link>
				</CutFrame>
				<CutFrame color={AMBER_BORDER}>
					<Link to="/items" className="cut-corner px-3 py-1.5 font-bold">
						Items
					</Link>
				</CutFrame>
			</div>
		</main>
	),
});

function RootComponent() {
	return (
		<RootDocument>
			<RouteLoadingBar />
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
				<Analytics />
				<SpeedInsights />
			</body>
		</html>
	);
}
