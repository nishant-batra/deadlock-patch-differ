// scripts/generateSitemap.ts
//
// Regenerates public/sitemap.xml: the 4 static top-level routes plus one
// <url> per live hero, at /heroes/${heroSlug(hero.name)}. Run standalone via
// `npm run generate-sitemap`, or as part of `npm run ingest` (see
// package.json) so the sitemap grows/shrinks with the live roster whenever
// the roster itself changes.

import fs from "node:fs";
import path from "node:path";
import heroesViewJson from "../app/data/heroes-view.json" with { type: "json" };
import type { Hero } from "../app/types";
import { heroSlug } from "../app/utils/heroSlug";
import { isLiveHero } from "../app/utils/roster";

const BASE_URL = "https://deadlockpatch.vercel.app";
const SITEMAP_PATH = path.join(process.cwd(), "public", "sitemap.xml");

type UrlEntry = {
	loc: string;
	changefreq: string;
	priority: string;
};

// The 4 existing static routes - same priority/changefreq values the
// hand-maintained file already used.
const STATIC_URLS: UrlEntry[] = [
	{ loc: `${BASE_URL}/`, changefreq: "hourly", priority: "1.0" },
	{ loc: `${BASE_URL}/heroes`, changefreq: "daily", priority: "0.8" },
	{ loc: `${BASE_URL}/items`, changefreq: "daily", priority: "0.8" },
	{ loc: `${BASE_URL}/compare`, changefreq: "weekly", priority: "0.7" },
];

function buildXml(urls: UrlEntry[], lastmod: string): string {
	const entries = urls
		.map(
			(url) =>
				`  <url>\n` +
				`    <loc>${url.loc}</loc>\n` +
				`    <lastmod>${lastmod}</lastmod>\n` +
				`    <changefreq>${url.changefreq}</changefreq>\n` +
				`    <priority>${url.priority}</priority>\n` +
				`  </url>`,
		)
		.join("\n");

	return (
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
		`${entries}\n` +
		`</urlset>\n`
	);
}

function generateSitemap() {
	const heroes = (heroesViewJson as unknown as Hero[]).filter(isLiveHero);
	const heroUrls: UrlEntry[] = heroes
		.map((hero) => ({
			loc: `${BASE_URL}/heroes/${heroSlug(hero.name)}`,
			changefreq: "weekly",
			priority: "0.6",
		}))
		// Stable, deterministic order so regenerating without a roster change
		// produces no diff.
		.sort((a, b) => a.loc.localeCompare(b.loc));

	const lastmod = new Date().toISOString().slice(0, 10);
	const xml = buildXml([...STATIC_URLS, ...heroUrls], lastmod);

	fs.writeFileSync(SITEMAP_PATH, xml);
	console.log(
		`Wrote public/sitemap.xml: ${STATIC_URLS.length} static + ${heroUrls.length} hero URLs.`,
	);
}

generateSitemap();
