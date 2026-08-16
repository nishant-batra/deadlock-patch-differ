# Deadlock Patch Differ

A web app for browsing [Deadlock](https://playdeadlock.com/) (Valve's hero shooter) patch notes as structured, comparable data instead of a wall of changelog text.

## Features

- **Hero pages** — stats, abilities, and scaling values for every hero
- **Hero compare** — put two heroes side by side and diff their stats/abilities
- **Items browser** — filterable list of all in-game items with their properties
- **Patch history** — ingested patch notes rendered as per-stat deltas (before → after), not raw text

## Stack

- [TanStack Start](https://tanstack.com/start) (React, SSR) + TanStack Router
- Tailwind CSS
- Vitest for tests
- Deployed on Vercel

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
pnpm build     # production build
pnpm preview   # preview the production build
pnpm test      # run tests
pnpm ingest    # ingest a new patch note into the dataset
```
