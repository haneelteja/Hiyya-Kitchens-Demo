# Query tracker

Open questions for the client. Never answer these with an assumption baked silently into the code — if we must assume something to keep moving, the assumption is written down here (and in `docs/PLAN.md`), stays visibly a demo simplification, and gets swapped out the moment a real answer arrives.

## Blocking — needed before Phase 1 can produce trustworthy demo data

- **Q00 — Source workbook.** The build prompt's Section 6/10 treat `Hiyya_Sample_SOP_Stock_Wastage_Aug2026.xlsx` (sheets: Branches, Ingredient_Master, Menu_Items, SOP_Recipes, Sales_Aug, Purchases, Wastage_Log, Stock_Ledger, Fixed_Costs, Revenue_Share, Branch_PnL_Aug, Query_Tracker) as the source of truth for `scripts/seed-from-xlsx.ts`, and its numbers as the Vitest acceptance target. **This file has not been provided to the engineering AI.** What we do have is the Section 10 table of monthly totals (net sales, food cost at SOP, actual food cost, net profit per branch) and the list of 10 "Investigate" ingredient lines. Phase 1 will build `lib/data/demo.json` by reverse-deriving self-consistent daily/ingredient-level detail that reconciles to those published totals — clearly documented as a demo allocation, not client data. Needed: the actual workbook, or confirmation that the Section 10 totals are the full extent of real data available for the demo.
- **Q00a — Reference HTML dataset.** The build prompt's Section 1 says `reference/hiyya-brand-owner-dashboard.html` embeds the full dataset in `<script id="data" type="application/json">`. The only existing HTML dashboard in this repo (`hiyya-brand-owner-dashboard.html`, built in an earlier session) stores its data as inline JS objects, not a JSON `<script>` tag, and its fabricated numbers predate and don't match this prompt's Section 10 table. Treating Section 10 as authoritative and rebuilding the dataset from there for Phase 1, unless told otherwise.

## Seeded from the v3 spec (Section 11)

- **Q01** — Which POS does each branch use, and is its inventory module in use? Decides how quickly real numbers can go live.
- **Q02** — Is in-stock data in the POS inventory module or in branch Excel sheets? Request samples of both.
- **Q03** — How often are stock counts taken?
- **Q04** — The SOP file, including size variants and yields.
- **Q05** — Do any branches use branch-specific recipes? What is the SOP change approval process?
- **Q06** — What does "revenue sharing between branches" mean, and what are the royalty terms? (Working assumption for the demo: 6% royalty + 2% marketing fund on franchise branches only, per the build prompt's Section 7 — needs client confirmation.)
- **Q07** — Full branch list with owners. Confirm the Space Mandi launch date and any other live branches. (Space Mandi's 2026-07-04 open date is explicitly flagged "demo assumption" in the build prompt; Jail Mandi Vizag's 2026-03-18 is flagged "assumed".)
- **Q08** — Which fixed-cost heads should be captured, and how often?
- **Q09** — Is purchasing central or per branch? How common are stock transfers?
- **Q10** — Is there an existing wastage log, and which reason codes does it use? (Demo uses six placeholder codes — see `docs/DATA_CONTRACT.md` once Phase 1 lands.)
- **Q11** — Can we get Swiggy/Zomato data, and what are the commission terms? (Demo assumes a flat 22% blended aggregator commission on the online share per the build prompt's Section 7 — needs confirmation.)
- **Q12** — Should history from before the rebrand be included?
- **Q13** — Should sales be shown net of GST and discounts?

## Log

| Date       | Question         | Status                                |
| ---------- | ---------------- | ------------------------------------- |
| 2026-09-17 | Q00, Q00a raised | Open — blocking Phase 1 data fidelity |
