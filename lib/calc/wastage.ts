export interface WastageReasonShare {
  reason: string;
  value: number;
}

/**
 * Splits a branch's total logged-wastage value across reason codes by a fixed,
 * documented weighting (Q10 is open — there's no real reason-coded ledger yet).
 * Exact residual correction on the last reason keeps the split summing to the
 * input total to the rupee.
 */
const REASON_WEIGHTS: Array<[string, number]> = [
  ["Over-portioning", 0.38],
  ["Spillage / handling", 0.24],
  ["Expiry", 0.16],
  ["Prep waste", 0.12],
  ["Kitchen error", 0.07],
  ["Customer return", 0.03],
];

export function wastageByReasonSplit(totalValue: number): WastageReasonShare[] {
  let running = 0;
  return REASON_WEIGHTS.map(([reason, weight], i) => {
    const value =
      i === REASON_WEIGHTS.length - 1
        ? totalValue - running
        : Math.round(totalValue * weight);
    running += value;
    return { reason, value };
  });
}
