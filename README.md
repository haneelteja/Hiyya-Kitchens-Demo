# HIYYA Command Center

Role-based analytics portal for HIYYA Kitchens (themed mandi restaurants, Hyderabad/AP). See `CLAUDE.md` for stack, conventions and process, and `docs/PLAN.md` for the phase-by-phase build plan.

## Status

**Stage A (demo)** — in progress, Phase 0 (scaffold). No authentication; a "View as" persona switcher drives all data via `MockDataSource`. Every number renders from `lib/calc`, unit-tested against the acceptance values in `docs/PLAN.md`.

## Getting started

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>.

## Commands

| Command          | What it does                           |
| ---------------- | -------------------------------------- |
| `pnpm dev`       | Local dev server                       |
| `pnpm build`     | Production build                       |
| `pnpm lint`      | ESLint                                 |
| `pnpm typecheck` | `tsc --noEmit`                         |
| `pnpm test`      | Vitest (calculation engine, selectors) |
| `pnpm e2e`       | Playwright (one spec per persona)      |

## Legacy artifact

`legacy-demo/` holds the original single-file HTML mockup built before this Next.js rebuild. It's kept for historical reference only and is not part of the live app.
