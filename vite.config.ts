import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

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
		}),
		viteReact({
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
		tanstackRouter({
			routesDirectory: "./app/routes",
			generatedRouteTree: "./app/routeTree.gen.ts",
		}),
	],
});

export default config;
