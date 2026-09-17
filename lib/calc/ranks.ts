export type RankMetric =
  | "netSales"
  | "netProfit"
  | "marginPct"
  | "foodCostPct"
  | "sopDeviationPct"
  | "growthPct";

export interface Ranked<T> {
  item: T;
  value: number;
  rank: number; // 1 is best
}

/**
 * Ranks branches by a metric. Lower-is-better metrics (food cost %, SOP deviation %)
 * must be passed with `lowerIsBetter: true` so rank 1 means the best branch, not the
 * largest number — this is what lets a Branch Owner see "rank 2 of 4" without ever
 * learning another branch's name or value.
 */
export function rankBy<T>(
  items: T[],
  getValue: (item: T) => number,
  options: { lowerIsBetter?: boolean } = {},
): Ranked<T>[] {
  const sorted = [...items].sort((a, b) => {
    const diff = getValue(a) - getValue(b);
    return options.lowerIsBetter ? diff : -diff;
  });
  return sorted.map((item, i) => ({ item, value: getValue(item), rank: i + 1 }));
}

/** Finds one item's rank within a full ranked list, without exposing the others. */
export function anonymizedRankOf<T>(
  ranked: Ranked<T>[],
  predicate: (item: T) => boolean,
) {
  const found = ranked.find((r) => predicate(r.item));
  return found ? { rank: found.rank, of: ranked.length } : null;
}

export function growthPct(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
