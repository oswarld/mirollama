## Local Fund Demo (Static)

Static, PDF-grounded demo console for [mirollama](https://github.com/oswarld/mirollama). It does **not** call external APIs. Built with Next.js App Router (16.x) + Tailwind v4 + `react-force-graph-2d`.

### Routes

- `/` redirects to `/live-demo/{lang}` based on the browser language.
- `/live-demo/ko`, `/live-demo/en`, `/live-demo/zh` render the demo console with a scenario-specific source PDF.

### What's on screen

The Step 1 (Graph Build) panel renders 50 scenario-relevant personas as a force-directed graph. Nodes are colored by `province × generation`, and connected by simple rules (same region → same sector → same generation). The Step 3 (Simulation) panel ticks a 50-round counter to evoke a multi-agent run.

Persona JSON files at `src/data/personas.{ko,zh,en}.json` are static. The graph is built client-side in `src/lib/persona-graph.ts` and rendered by `src/components/PersonaGraph.tsx`.

### Persona data

| Lang | Source | Scenario |
|------|--------|----------|
| `ko` | `Nemotron-Personas-Korea` (sampled via `scripts/extract-personas-ko.py`) | 지방소멸대응기금 (regional decline response fund) |
| `zh` | hand-authored | 第一次债权人会议 (first creditors' meeting) |
| `en` | hand-authored | FAA civil aviation data classification |

To regenerate the Korean subset (requires the Nemotron Arrow files at `../Nemotron-Personas-Korea/`):

```bash
uv run --with datasets --with pyarrow python scripts/extract-personas-ko.py
```

### Local PDFs

The demo loads PDFs from `./public/` via iframe. Keep filenames in sync with `src/app/live-demo/[lang]/page.tsx`.

## Build & Serve

```bash
npm install
npm run build
npm run start    # serves the production build on :3000
```

> **Heads up — `next dev` (Turbopack) currently hangs** because the parent
> `mirollama/package.json` is picked up as a workspace root. For local iteration
> use `npm run build && npm run start` until that's resolved (likely via a
> `turbopack.root` adjustment or by isolating the demo from the parent repo).

## Deploy on Vercel

If this repository is a monorepo, set the Vercel project Root Directory to `local-fund-demo`.

- Framework Preset: Next.js
- Build Command: `npm run build`
- Output: leave default (Next.js)
