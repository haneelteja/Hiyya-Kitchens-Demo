import type { IngredientUsageRow, SopLine } from "@/lib/data/types";

/**
 * SOP usage per branch × ingredient = Σ (portions sold × SOP qty per portion ÷ yield).
 * A branch-specific SOP line replaces the generic ("ALL") line for that branch only.
 *
 * This is the real formula, unit-tested on its own with a small synthetic fixture.
 * The demo's Aug ingredient-variance figures (lib/data/demo.json → ingredientUsageAug)
 * are stored pre-aggregated rather than derived by calling this against simulated
 * per-sale POS data — see docs/DATA_CONTRACT.md for why. Everything downstream
 * (deviation, flags, ₹ values) still runs through the calc engine below, not
 * hardcoded figures.
 */
export function resolveEffectiveSopLines(
  lines: SopLine[],
  branchCode: string,
  onDate: string,
): SopLine[] {
  const isEffective = (l: SopLine) =>
    l.effectiveFrom <= onDate && (l.effectiveTo === null || l.effectiveTo >= onDate);

  const byItemIngredient = new Map<string, SopLine>();
  for (const line of lines.filter(isEffective).filter((l) => l.appliesTo === "ALL")) {
    byItemIngredient.set(`${line.menuItemCode}:${line.ingredientKey}`, line);
  }
  // Branch-specific lines override the generic ones for the same item+ingredient.
  for (const line of lines
    .filter(isEffective)
    .filter((l) => l.appliesTo === branchCode)) {
    byItemIngredient.set(`${line.menuItemCode}:${line.ingredientKey}`, line);
  }
  return [...byItemIngredient.values()];
}

/** Σ (portions sold × qty per portion ÷ (yield% / 100)) for one ingredient. */
export function computeSopUsageFromSales(
  effectiveLines: SopLine[],
  ingredientKey: string,
  portionsSoldByItem: Record<string, number>,
): number {
  return effectiveLines
    .filter((l) => l.ingredientKey === ingredientKey)
    .reduce((sum, line) => {
      const portions = portionsSoldByItem[line.menuItemCode] ?? 0;
      const yieldFraction = (line.yieldPct || 100) / 100;
      return sum + (portions * line.qtyPerPortion) / yieldFraction;
    }, 0);
}

export type DeviationFlag = "investigate" | "watch" | "below_sop" | "ok";

/** Investigate > 5%, Watch > 2%, Below SOP < -2%, OK otherwise (Section 4/7). */
export function flagForDeviationPct(pct: number): DeviationFlag {
  if (pct > 5) return "investigate";
  if (pct > 2) return "watch";
  if (pct < -2) return "below_sop";
  return "ok";
}

export interface DeviationResult {
  unexplainedQty: number;
  deviationPct: number;
  unexplainedValue: number;
  flag: DeviationFlag;
}

/**
 * Unexplained deviation = actual − SOP usage − recorded wastage.
 * Deviation % = unexplained ÷ SOP usage.
 * Value = quantity × standard rate.
 */
export function computeDeviation(
  row: Pick<IngredientUsageRow, "sopUsageQty" | "actualUsageQty" | "wastageQty">,
  standardRate: number,
): DeviationResult {
  const unexplainedQty = row.actualUsageQty - row.sopUsageQty - row.wastageQty;
  const deviationPct =
    row.sopUsageQty === 0 ? 0 : (unexplainedQty / row.sopUsageQty) * 100;
  return {
    unexplainedQty,
    deviationPct,
    unexplainedValue: unexplainedQty * standardRate,
    flag: flagForDeviationPct(deviationPct),
  };
}

/** (rate paid − standard rate) × qty, shown separately from the deviation figure. */
export function computePurchasePriceVariance(
  qty: number,
  ratePaid: number,
  standardRate: number,
): number {
  return (ratePaid - standardRate) * qty;
}
