import type { Purchase, StockCount, Transfer } from "@/lib/data/types";

/** Actual usage = opening + purchases + transfers in − transfers out − closing. */
export function computeActualUsage(input: {
  opening: number;
  purchases: number;
  transfersIn: number;
  transfersOut: number;
  closing: number;
}): number {
  return (
    input.opening +
    input.purchases +
    input.transfersIn -
    input.transfersOut -
    input.closing
  );
}

/** Sums purchases for one branch × ingredient over a set of stock-count-bounded dates. */
export function sumPurchases(
  purchases: Purchase[],
  branchCode: string,
  ingredientKey: string,
  fromDateExclusive: string,
  toDateInclusive: string,
): number {
  return purchases
    .filter(
      (p) =>
        p.branchCode === branchCode &&
        p.ingredientKey === ingredientKey &&
        p.date > fromDateExclusive &&
        p.date <= toDateInclusive,
    )
    .reduce((sum, p) => sum + p.qty, 0);
}

export function sumTransfers(
  transfers: Transfer[],
  branchCode: string,
  ingredientKey: string,
  direction: "in" | "out",
): number {
  return transfers
    .filter(
      (t) =>
        t.ingredientKey === ingredientKey &&
        (direction === "in" ? t.toBranch === branchCode : t.fromBranch === branchCode),
    )
    .reduce((sum, t) => sum + t.qty, 0);
}

/** Finds the nearest stock count of a given type on/before a date — "snap to available counts". */
export function findNearestCount(
  counts: StockCount[],
  branchCode: string,
  ingredientKey: string,
  countType: StockCount["countType"],
  onOrBefore: string,
): StockCount | undefined {
  return counts
    .filter(
      (c) =>
        c.branchCode === branchCode &&
        c.ingredientKey === ingredientKey &&
        c.countType === countType &&
        c.date <= onOrBefore,
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

export interface ReorderStatus {
  daysOfCover: number;
  status: "ok" | "reorder_soon" | "order_today";
}

/** Reorder: cover under 2.5 days is "reorder soon", under 1.5 days is "order today" (Section 7). */
export function computeReorderStatus(
  qtyOnHand: number,
  avgDailyUsage: number,
): ReorderStatus {
  if (avgDailyUsage <= 0) return { daysOfCover: Infinity, status: "ok" };
  const daysOfCover = qtyOnHand / avgDailyUsage;
  const status =
    daysOfCover < 1.5 ? "order_today" : daysOfCover < 2.5 ? "reorder_soon" : "ok";
  return { daysOfCover, status };
}
