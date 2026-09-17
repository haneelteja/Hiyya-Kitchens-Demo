# HIYYA Command Center — project memory

## What this is

A role-based analytics portal for HIYYA Kitchens (themed mandi restaurants, Hyderabad/AP). Stage A is a no-auth demo with fabricated data and a "View as" persona switcher. Stage B (after a signed work order) swaps the mock data layer for Supabase behind the same interface — the UI must not need to change for that swap.

## Stack

Next.js 14 (App Router), TypeScript strict, Tailwind CSS + shadcn/ui, Apache ECharts via `echarts-for-react`, three.js/@react-three/fiber/drei for the 3D throne stage, Zustand + Zod, date-fns (IST) + SheetJS, Framer Motion (panel/drawer transitions only), Vitest + Playwright, pnpm.

## Commands

| Command             | What it does                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `pnpm dev`          | Local dev server (<http://localhost:3000>)                                                         |
| `pnpm build`        | Production build                                                                                   |
| `pnpm lint`         | ESLint (`next/core-web-vitals` + `next/typescript` + Prettier compat)                              |
| `pnpm typecheck`    | `tsc --noEmit`                                                                                     |
| `pnpm format`       | Prettier, write mode                                                                               |
| `pnpm format:check` | Prettier, check-only (CI)                                                                          |
| `pnpm test`         | Vitest, single run (calculation engine, selectors)                                                 |
| `pnpm test:watch`   | Vitest, watch mode                                                                                 |
| `pnpm e2e`          | Playwright — `chromium` (1440px desktop) and `mobile` (390px) projects, auto-starts the dev server |

Package manager: pnpm (already available in this environment; no global install needed). Node 24 locally — the spec pins Node 20, but nothing here depends on a Node-20-only API; noted as a drift, not a blocker.

### Notable dependency pins (deliberate, not defaults)

`create-next-app@latest` and `shadcn@latest` both currently resolve to versions newer than this spec targets (Next 16 + React 19 + Tailwind v4, and a new `@base-ui/react`-based shadcn preset, respectively). Both were pinned back down during Phase 0 for stability and to match the spec's explicit "Next.js 14" line:

- `next@14.2.35`, `react@18.3.1` — spec-pinned.
- `tailwindcss@^3.4` — pairs with Next 14-era shadcn/ui; not Tailwind v4.
- `shadcn` CLI run at `@2.3.0` (`style: "new-york"`, individual `@radix-ui/react-*` packages, `cn()` via `clsx` + `tailwind-merge`) — the classic, widely-documented architecture, not the newer `base-nova`/`@base-ui/react` preset the latest CLI defaults to.
- `@react-three/fiber@8` + `@react-three/drei@9` — the majors compatible with React 18 (`fiber@9`/`drei@10` require React 19 and would conflict with the Next-14 pin).
- `vitest@1` — pairs with the `@types/node@20` that Next 14's scaffold installs (`vitest@5` requires `@types/node@22+`).

If any of these move (a Next 15 upgrade, etc.), re-check the peer-dependency chain above before bumping just one package.

## Conventions

- **No hardcoded figures in the UI.** Every number renders from `lib/calc`, unit-tested against the Section 10 acceptance values in `docs/PLAN.md`.
- **Access control lives in `lib/access/scope.ts` and the data layer**, never only in a component. Branch Owners never see another branch's identifiable data (ranks only, never names/values). Branch Managers never see P&L.
- **`DataSource` is an interface.** `MockDataSource` today, `SupabaseDataSource` later — same method signatures, scope- and period-aware.
- Sentence case everywhere, active-verb button labels ("Save purchase", not "Submit").
- Black-and-gold only; no light mode; red/green reserved for deltas, flags, and leak charts.
- Demo edits (fixed costs, purchases, wastage, SOP overrides) live in the Zustand store, in memory only — never `localStorage`/`sessionStorage` for business data. Only the motion-preference toggle persists.
- Every chart: title, one-line subtitle, and an accessible alternative (a table or list a keyboard/screen-reader user can reach).

## Process rules (do not skip)

- Plan before code; get a "go" before each new phase (see `docs/PLAN.md`).
- After each phase: lint + typecheck + test green, commit as `phase-N: <summary>`, report in the Section 13 format, then stop.
- Unclear or missing input → write it to `docs/QUERY_TRACKER.md` under Questions. Do not guess and ship silently.
- `reference/` is read-only source material, not something to edit as part of a phase.

## Known open blockers

See `docs/QUERY_TRACKER.md` Q00/Q00a — the source workbook and the JSON-embedded reference HTML haven't been provided. Phase 1's demo dataset is built top-down from the published Section 10 acceptance table instead, documented as such in `docs/DATA_CONTRACT.md`.
