# Master Prompt v3: HIYYA Command Center (Role-Based Analytics Platform)

> Preserved verbatim from the client-facing planning conversation, for reference during the production build. This is the long-term spec referenced by the Phase build prompt; the Phase build prompt (see `docs/PLAN.md`) is authoritative where the two differ (e.g. exact branch codes, persona list, acceptance numbers, calculation formulas).

## 0. Your role and how to work

Current stage: demo only. Until a work order is received, the deliverable is the clickable mockup `hiyya-brand-owner-dashboard.html`:

- Fabricated data
- No authentication or authorisation
- A "View as" role switcher in the header that re-renders tabs, charts and data for each role

Everything below describes the full build to start after the work order.

You are a senior product engineer and UI designer. Build a production-grade, role-based analytics platform for HIYYA Kitchens, a multi-branch themed mandi restaurant brand.

Work in phases (Section 12). After each phase: stop, summarise what you built and which files changed, list how to verify it (including which test login to use and what that login should and should not see), and wait for confirmation before starting the next phase.

### Stack

Next.js 14 (App Router) and TypeScript; Supabase (Postgres, Auth, Row Level Security); Tailwind CSS and shadcn/ui; Apache ECharts via echarts-for-react (drill-down, heatmaps, waterfall, linked charts); TanStack Query and Zod; SheetJS for Excel import. Enforce all authorisation in the database with RLS, never only in the UI.

The platform has four pillars: sales performance; expenses and profitability; overall brand visibility across branches, themes and owners; SOP deviation (stock and wastage against the recipe SOP — the client's top priority).

Primary persona: the Brand Owner (best screen in the product). Branch Owner is second.

## 1. Brand context

Positioning: HIYYA Kitchens runs "theatrical dining" — immersive themed mandi restaurants (Arabian cuisine) at a middle-class price point. Instagram-led, celebrity launches. Tagline: "Get Arrested by Taste."

Owners: founders/brand owners — Gautamy Chowdary, with partners Gautham and Vikranth. Model: brand-owned flagship plus franchise partners.

### Branches (seed data, v3 draft — superseded by the Phase build prompt's exact table)

| Code | Branch            | Location                                  | Theme       | Ownership (demo)               | Status                                                   |
| ---- | ----------------- | ----------------------------------------- | ----------- | ------------------------------ | -------------------------------------------------------- |
| B01  | Chrono Jail Mandi | Madhapur, Hyderabad, TS                   | Chrono Jail | Brand-owned flagship           | Live (Dec 2025)                                          |
| B02  | Dino Mandi        | Kukatpally (GPR Multiplex), Hyderabad, TS | Dino        | Franchise, Suresh Reddy (demo) | Live (May 2026)                                          |
| B03  | Jail Mandi        | Dwaraka Nagar, Visakhapatnam, AP          | Jail        | Franchise, Suresh Reddy (demo) | Live (open date assumed)                                 |
| B04  | Space Mandi       | Ameerpet, Hyderabad, TS                   | Space       | Franchise, Anil Kumar (demo)   | Announced May 2026; shown live from Jul 2026 in the demo |

No other branches. Never hardcode branches, themes, cities or states — admin-configurable records.

Menu items seen publicly: Chicken Juicy Mandi (sizes), Crispy Fried + Juicy Chicken Mandi, Fish + Juicy Chicken Mandi, Paneer Mini Mandi, Mutton Mandi, Chicken Chekkalu, Street Style Chicken Pakoda, Cheesy Kurkure Mushroom, Kaddu Ka Kheer, Apricot Delight, Platters and BBQ grills.

Known operational risk from public reviews: inconsistent service and food consistency (e.g. oily rice) — SOP deviation on rice, oil and ghee is a realistic early signal.

## 2. Seed data and reference artefacts

Seed workbook: `Hiyya_Sample_SOP_Stock_Wastage_Aug2026.xlsx` — seed dataset and Excel-import template. Sheets: Branches, Ingredient_Master, Menu_Items, SOP_Recipes (generic + branch-specific overrides), Sales_Aug, Purchases, Wastage_Log, Stock_Ledger (the SOP-deviation calculation), Fixed_Costs, Revenue_Share, Branch_PnL_Aug, Query_Tracker. The platform's August 2026 numbers must match this workbook exactly — treat as an acceptance test.

**Status: this workbook has not been provided to the engineering AI as a file.** See `docs/QUERY_TRACKER.md` Q00.

Design reference: `hiyya-brand-owner-dashboard.html` — a working Brand Owner prototype. Keep its IA: tabs (Overview, Sales, Expenses & profit, SOP & wastage, Branches, Revenue share), scope switcher (all branches / single branch / theme / owner portfolio), drill-down by clicking, black-and-gold visual language.

Earlier draft ("Franchise Analytics") also had Purchase, Staff, Marketing, Feedback & Sentiment and Franchise Compliance tabs. Purchase is now part of SOP & wastage. Staff/Marketing/Feedback/Compliance are later-phase modules. Its branch names (Banjara Hills, Gachibowli, etc.) were fictional — do not reuse.

## 3. Roles and access

One application; routes render different data/widgets/nav based on the logged-in user's memberships.

| Role           | Scope                | Can see                                                                                 | Can do                                                                 |
| -------------- | -------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Brand Owner    | Whole brand          | Everything                                                                              | Manage users, branches, themes, royalty terms; everything below        |
| Brand Manager  | Whole brand          | All branches' sales, expenses, profitability, SOP deviation, rank charts, revenue share | Maintain SOP recipes, set targets/alerts, maintain ingredient master   |
| Branch Owner   | One or more branches | Full analytics for their branches; portfolio roll-up; anonymised rank vs network        | Enter fixed costs; view/approve purchases                              |
| Branch Manager | Exactly one branch   | Today's/this month's operational view                                                   | Record purchases, stock counts, transfers, wastage; upload stock Excel |

### Data model (Supabase) — masters, SOP, sales, stock, expenses/revenue-share, output/audit

(Full entity list: organizations, themes, regions, branches, memberships, ingredients, menu_items, sop_recipes, sales_lines, purchases, stock_counts, stock_transfers, wastage_log, fixed_costs, revenue_share_terms, aggregator_terms, rollups, alerts, targets, imports, audit_log — see the Phase build prompt's Section 6 for the current schema shape.)

RLS: `accessible_branch_ids(uid)` helper; every fact table filters on it; financial views gated by role; write access split by role as above.

### Login flow

Brand Owner → Brand Command Center. Brand Manager → Brand Analytics. Branch Owner (1 branch) → their branch at a glance; (multi-branch) → portfolio view with switcher. Branch Manager → Today at my branch. Header scope switcher only lists what the user may see.

## 4. SOP deviation engine (core requirement)

| Measure                 | Formula                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| SOP usage (theoretical) | Σ (items sold × SOP qty per portion ÷ yield), using the SOP version effective on the sale date with branch overrides applied |
| Actual usage            | Opening count + purchases + transfers in − transfers out − closing count                                                     |
| Recorded wastage        | Σ wastage log                                                                                                                |
| Unexplained deviation   | Actual − SOP usage − recorded wastage                                                                                        |
| Deviation %             | Unexplained ÷ SOP usage                                                                                                      |
| Value                   | Every quantity × the ingredient's standard rate                                                                              |
| Purchase price variance | (rate paid − standard rate) × qty, shown separately                                                                          |

Flags (v3 draft — superseded by the Phase build prompt's exact thresholds, which add a "Below SOP" band): Investigate above 5%, Watch above 2%. Thresholds configurable per ingredient. Item-level drill-down shows which menu items consume a flagged ingredient. Period handling snaps to available stock-count dates.

Data sources (both from day one): POS inventory module (connector/scheduled export — which POS is Q01), and Excel sheets per branch (upload wizard matching the seed workbook's Purchases/Stock_Ledger/Wastage_Log sheets, with validation, preview, import history).

## 5. KPIs by role

(Branch Manager → Branch Owner → Brand Manager → Brand Owner, each with a KPI catalogue entry: id, label, formula, unit, grain, allowed roles, target support, alert support, drill path, tooltip. Full per-role KPI lists carried into the Phase build prompt's Section 8 screen specs — see there for the current, authoritative version.)

Excluded by client decision: manager-wise/shift-wise variance and count-compliance rate.

## 6. Visual design system

Black and gold (client requirement; no light mode in v3 — the Phase build prompt keeps this and drops the "optional light mode" idea entirely).

| Token              | Value                                       |
| ------------------ | ------------------------------------------- |
| Background         | `#000000`                                   |
| Panels             | `#110F0C` / `#1B1813`                       |
| Gold (primary)     | `#D4AF37`                                   |
| Champagne          | `#F2DFA7`                                   |
| Deep gold          | `#8A6C2A`                                   |
| Bronze             | `#B07A3A`                                   |
| Platinum           | `#B9B6AE`                                   |
| Text               | `#F3ECDC`                                   |
| Muted text         | `#9A907E`                                   |
| Gain               | `#9CCB9F` (deltas only)                     |
| Loss / investigate | `#D8674F` (deltas, flags, leak charts only) |
| Warning            | `#E6BE5A`                                   |

Branch colours stay inside the gold family: Chrono Jail gold, Dino champagne, Jail (Vizag) bronze, Space platinum. Typography: Cormorant Garamond (headings/big figures), Manrope (UI/data), tabular numerals, sentence case. Numbers: Indian format (₹1,23,456; ₹39.6 L; ₹1.67 Cr), IST timezone.

Signature element: the "Lost to SOP deviation" hero card uses a subtle gold vertical-bar texture (nod to the jail concept).

## 7–14 (insights/alerts, non-functional requirements, test accounts, acceptance checks, open queries, build phases)

These sections were superseded, tightened, and made numerically exact by the Phase build prompt (see `docs/PLAN.md` for the version this build follows, including the authoritative Section 10 acceptance table, Section 11 query tracker seed, and Section 12 phase list). Refer to the Phase build prompt as the operative spec; this file is kept for brand/context background only.
