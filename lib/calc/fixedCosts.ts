import type { FixedCost } from "@/lib/data/types";

/** Monthly heads spread per day as total ÷ days in month. */
export function fixedCostPerDay(monthlyTotal: number, daysInMonth: number): number {
  return monthlyTotal / daysInMonth;
}

/** Weekly buckets take the share of days that fall in the month (for a partial week). */
export function fixedCostForDaysInMonth(
  monthlyTotal: number,
  daysInMonth: number,
  daysFallingInMonth: number,
): number {
  return fixedCostPerDay(monthlyTotal, daysInMonth) * daysFallingInMonth;
}

export function sumFixedCosts(
  costs: FixedCost[],
  branchCode: string,
  month: string,
): number {
  return costs
    .filter((c) => c.branchCode === branchCode && c.month === month)
    .reduce((sum, c) => sum + c.amount, 0);
}

export function fixedCostsByHead(
  costs: FixedCost[],
  branchCode: string,
  month: string,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of costs) {
    if (c.branchCode === branchCode && c.month === month) {
      out[c.head] = (out[c.head] ?? 0) + c.amount;
    }
  }
  return out;
}

/**
 * Applies a fixed-cost edit and returns the new monthly total — the caller re-runs
 * computePnl with this total. Verifies the "raising Dino rent by ₹78,000 lowers
 * profit by exactly ₹78,000" acceptance case: this function's output, minus the
 * input total, must equal the delta.
 */
export function applyFixedCostEdit(
  currentTotal: number,
  head: string,
  currentHeadAmount: number,
  newHeadAmount: number,
): number {
  return currentTotal - currentHeadAmount + newHeadAmount;
}
