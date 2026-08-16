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
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import type { ReactNode } from "react";
import AdSlot from "#/components/ad-slot";
import { ADSENSE_PUBLISHER_ID } from "#/components/ad-slot/constants";
import PatchHeader from "#/components/patch-header";
import ScrollToTop from "#/components/scroll-to-top";
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
			{
				title:
					"Deadlock Patch Comparator — Visual Patch Notes, Hero & Item Changes",
			},
			{
				name: "description",
				content:
					"Interactive visual breakdown of Valve's Deadlock patches. Track hero stat changes, ability upgrades, item buffs & nerfs, and patch notes in real time.",
			},
			{
				name: "keywords",
				content:
					"Deadlock patch notes, Deadlock changes, Deadlock buffs and nerfs, Deadlock hero stats, Deadlock item changes, Deadlock update tracker, Valve Deadlock",
			},
			{ name: "theme-color", content: "#090d16" },
			{
				name: "google-site-verification",
				content: "70a-hi7LXl9oYXXOugLieN1KF_AekN35jMWI73TkCoI",
			},
			{ property: "og:site_name", content: "Deadlock Patch Comparator" },
			{ property: "og:type", content: "website" },
			{ property: "og:locale", content: "en_US" },
			{ name: "twitter:card", content: "summary_large_image" },
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
	loader: async () => fetchPatchMeta(),
	component: RootComponent,
});

function RootComponent() {
	const meta = Route.useLoaderData();
	return (
		<RootDocument>
			<PatchHeader meta={meta} />
			<div className="ad-rail-row">
				<AdSlot
					slotId="TODO-ad-unit-sticky-rail"
					wrapperClassName="ad-rail-wrap"
					className="ad-rail"
				/>
				<div className="min-w-0 flex-1">
					<Outlet />
				</div>
			</div>
			<ScrollToTop />
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
