# Data contract

What every type in `lib/data/types.ts` means, where the demo's numbers come from, and
the column mapping a future Excel/POS importer will need. This is the reference for
Phase 1 and for whoever eventually answers `docs/QUERY_TRACKER.md`.

## Why the demo dataset looks the way it does

Per Q00/Q00a, the source workbook and the JSON-embedded reference HTML were never
provided. `scripts/build-demo-data.ts` builds `lib/data/demo.json` top-down from the
one piece of real, exact data available — the Section 10 acceptance table — rather
than inventing branch numbers freely. Concretely:

1. **Branch-level P&L (Aug 2026)** — net sales, food cost at SOP, actual food cost,
   and net profit are the literal Section 10 figures, not derived.
2. **Commission / royalty / fixed costs** — back-solved so `computePnl()` reproduces
   the Section 10 net profit exactly, under two disclosed assumptions:
   - Online sales share = 40% of net sales, blended aggregator commission = 22%
     (Q11 open — real Swiggy/Zomato figures will replace this).
   - Franchise branches (B02–B04) pay 6% royalty + 2% marketing fund; the brand-owned
     flagship (B01) pays neither (Q06 open — real royalty terms will replace this).
   - Whatever's left over after sales − actual food cost − commission − royalty −
     fund − net profit becomes that branch's fixed-cost total for the month.
3. **Ingredient-level SOP/actual/wastage (Aug 2026)** — `(actualFoodCost -
foodCostAtSop)` per branch is split into a deviation portion and a wastage
   portion (chosen so the brand-wide totals hit the acceptance table's named
   figures — see "The ±₹1–5 rounding note" below), then spread across the 9
   tracked ingredients so that **exactly** the 10 named "Investigate" lines exceed
   the 5% threshold and nothing else does. The generator asserts this by construction
   and Vitest re-verifies it against the running dataset.
4. **Everything else** (monthly history before Aug, daily Aug sales, fixed-cost
   heads, channel shares, wastage-by-reason, purchases, stock) is generated with a
   seeded, documented allocation — plausible and internally consistent, but not
   claimed to be real. It reconciles back to the Aug totals above; it does not
   introduce new "true" numbers of its own.

**Replacing this with the real workbook**: rewrite `scripts/build-demo-data.ts` (or
add `scripts/seed-from-xlsx.ts` alongside it) to read the actual sheets instead of
the `SECTION_10` constant at the top of the file. Nothing in `lib/calc`, `DataSource`,
or any component should need to change — they all consume the same `DemoDataset`
Zod shape regardless of where the JSON came from.

### The ±₹1–5 rounding note

`sum(actualFoodCost_i - foodCostAtSop_i)` across the four branches, using the exact
Section 10 branch figures, is ₹2,72,179. The acceptance table's named brand totals
(`unexplained deviation ₹1,79,962` + `logged wastage ₹92,216`) sum to ₹2,72,178 — one
rupee less. That single rupee of slack is already present in the Section 10 table
itself (the branch rows don't perfectly foot to the stated brand row either), not
something this build introduced. `tests/calc/acceptance.test.ts` uses a ±₹5 tolerance
for the two brand-wide totals for this reason, tighter than the ±₹50 P&L tolerance
the spec sets, but non-zero.

## Type-by-type notes and future column mapping

| Type                      | Demo source                                                                                                                                                            | Real-world column mapping (Excel/POS, once available)                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `Branch`                  | Hardcoded, Section 5's exact table                                                                                                                                     | `Branches` sheet: code, name, location, theme, ownership, owner, opened date                                   |
| `Ingredient`              | 9 items matching the Section 8 heatmap axis exactly (chicken, mutton, fish, rice, ghee, oil, mayo, milk, cheese)                                                       | `Ingredient_Master`: code, name, unit, standard rate                                                           |
| `MenuItem`                | 8 representative items covering all 9 ingredients                                                                                                                      | `Menu_Items`: code, name, category, price, POS item mapping                                                    |
| `SopLine`                 | Generic recipe qty/portion for all 8 items, plus one branch override (B01 Chicken Juicy Mandi)                                                                         | `SOP_Recipes`: item, ingredient, qty/portion, unit, `appliesTo` (ALL or branch code), effective dates, version |
| `MonthlyPnlInput`         | Aug 2026 exact (Section 10); earlier months are a seeded ramp to Aug, **not asserted by any test**                                                                     | `Branch_PnL_Aug` (Aug only — historical months need a separate export)                                         |
| `DailySales`              | Seeded weekday-weighted allocation summing exactly to the branch's Aug total                                                                                           | `Sales_Aug`, aggregated to daily                                                                               |
| `IngredientUsageRow`      | Reconciled per branch/ingredient — see above                                                                                                                           | `Stock_Ledger`: opening + purchases + transfers in − transfers out − closing, per ingredient per period        |
| `FixedCost`               | Aug total split across 9 heads by fixed weights (Salaries 40%, Rent 30%, Electricity 10%, Gas/Maintenance 5% each, Marketing/Water 3% each, Software/Security 2% each) | `Fixed_Costs`: branch, month, head, amount                                                                     |
| `RevenueShareTerm`        | 6%/2% for franchises, 0/0 for the brand-owned flagship (Q06 assumption)                                                                                                | `Revenue_Share`: branch, royalty %, marketing fund %, effective dates                                          |
| `AggregatorTerm`          | 22% flat for both Swiggy and Zomato (Q11 assumption)                                                                                                                   | Aggregator commission statements/contracts                                                                     |
| `ChannelShare`            | Dine-in 60% / Swiggy 22% / Zomato 18% for every branch (Q11 assumption)                                                                                                | POS channel split, if tracked; else derived from aggregator payout data                                        |
| `WastageEntry`            | 3 representative entries per branch — illustrative, not a full ledger, and not required to sum to the branch wastage total                                             | `Wastage_Log`: date, ingredient/item, qty, reason code, note, recorded by                                      |
| `Purchase`                | 3 representative entries per branch — illustrative                                                                                                                     | `Purchases`: date, supplier, ingredient, qty, rate paid, invoice ref                                           |
| `StockOnHand`             | Derived: `avgDailyUsage = actualUsageQty / 30`, `qtyOnHand = avgDailyUsage × (seeded 1–9 days of cover)`                                                               | `Stock_Ledger` opening/closing counts, once count frequency is known (Q03)                                     |
| `StockCount` / `Transfer` | Empty in the demo — no opening/closing counts or cross-branch transfers are fabricated (an honest "we don't have this yet" rather than invented ledger entries)        | `Stock_Ledger` counts; transfer log, once Q02/Q09 are answered                                                 |

## Wastage reason codes (demo placeholder — Q10 open)

`Over-portioning`, `Spillage / handling`, `Expiry`, `Prep waste`, `Kitchen error`,
`Customer return`. Replace with the client's real reason codes once Q10 is answered.

## SOP lines vs. ingredient usage — why they're decoupled right now

`SopLine` (recipe qty per portion) and `IngredientUsageRow` (Aug's aggregate
SOP/actual/wastage per ingredient) are independently sourced in this demo: the
former exists to demonstrate the generic/branch-override structure and feed the
recipe-impact-preview calculation (`computeRecipeImpact`, `computeSopUsageFromSales`
— both unit-tested against small synthetic fixtures), the latter is reconciled
directly to Section 10. In the real system, `IngredientUsageRow.sopUsageQty` would
be _computed from_ `SopLine` × actual portions sold via `computeSopUsageFromSales` —
that requires per-sale POS data we don't have yet (Q01/Q02). Once it exists, the two
tables collapse into one derivation and `ingredientUsageAug` stops being a stored
input.
