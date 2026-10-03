import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

type Changefreq = "hourly" | "daily" | "weekly";

// Sitemap hints per top-level path; anything else (the /heroes/$slug pages)
// falls back to HERO_PAGE_SITEMAP.
const SITEMAP_BY_PATH: Record<
	string,
	{ priority: number; changefreq: Changefreq }
> = {
	"/": { priority: 1, changefreq: "hourly" },
	"/heroes": { priority: 0.8, changefreq: "daily" },
	"/items": { priority: 0.8, changefreq: "daily" },
	"/compare": { priority: 0.7, changefreq: "weekly" },
};
const HERO_PAGE_SITEMAP = { priority: 0.6, changefreq: "weekly" } as const;

const config = defineConfig({
	server: {
		port: process.env.PORT ? Number(process.env.PORT) : 5173,
	},
	plugins: [
		devtools(),
		nitro({ preset: "vercel", rollupConfig: { external: [/^@sentry\//] } }),
		tsconfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
		tanstackStart({
			srcDirectory: "./app",
			// Every loader reads static JSON from app/data, so the whole site can
			// be rendered at build time. Starts at "/" and follows <a> links, which
			// reaches every /heroes/$slug page.
			prerender: {
				enabled: true,
				crawlLinks: true,
				failOnError: true,
				// The output file is named from the path with the query string
				// dropped, so /compare?heroes=abrams would overwrite
				// compare/index.html with Abrams preselected. Skip those - they
				// still work, rendered on demand. The crawler has already added
				// them to the sitemap's page list by the time this runs, so they
				// are excluded from it here too.
				filter: (page) => {
					if (page.path.includes("?")) {
						page.sitemap = { exclude: true };
						return false;
					}
					page.sitemap = SITEMAP_BY_PATH[page.path] ?? HERO_PAGE_SITEMAP;
					return true;
				},
			},
			// Built from the prerendered pages on every build, so it follows the
			// hero roster without a separate script.
			sitemap: { enabled: true, host: "https://deadlockpatch.vercel.app" },
		}),
		viteReact({
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
	],
});

export default config;
