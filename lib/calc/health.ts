export type HealthStatus = "needs_action" | "watch" | "healthy";

/**
 * "Needs action" if margin < 0 or deviation > 6%;
 * "Watch" if margin < 8% or deviation > 4%;
 * otherwise "Healthy" (Section 7).
 */
export function computeHealth(marginPct: number, deviationPct: number): HealthStatus {
  if (marginPct < 0 || deviationPct > 6) return "needs_action";
  if (marginPct < 8 || deviationPct > 4) return "watch";
  return "healthy";
}

/** Today's target (managers): average of the same weekday's sales this month × 1.05. */
export function computeTodayTarget(sameWeekdaySalesThisMonth: number[]): number {
  if (sameWeekdaySalesThisMonth.length === 0) return 0;
  const avg =
    sameWeekdaySalesThisMonth.reduce((a, b) => a + b, 0) /
    sameWeekdaySalesThisMonth.length;
  return avg * 1.05;
}

/**
 * Recipe impact preview: Δ SOP usage = (new qty − current effective qty) × portions sold;
 * the new deviation % is recomputed from that.
 */
export function computeRecipeImpact(input: {
  currentQtyPerPortion: number;
  newQtyPerPortion: number;
  portionsSold: number;
  actualUsageQty: number;
  wastageQty: number;
  currentSopUsageQty: number;
}) {
  const deltaSopUsage =
    (input.newQtyPerPortion - input.currentQtyPerPortion) * input.portionsSold;
  const newSopUsageQty = input.currentSopUsageQty + deltaSopUsage;
  const newUnexplainedQty = input.actualUsageQty - newSopUsageQty - input.wastageQty;
  const newDeviationPct =
    newSopUsageQty === 0 ? 0 : (newUnexplainedQty / newSopUsageQty) * 100;
  return { deltaSopUsage, newSopUsageQty, newUnexplainedQty, newDeviationPct };
}
