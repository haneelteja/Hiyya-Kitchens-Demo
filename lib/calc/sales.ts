export interface DailyPoint {
  date: string;
  netSales: number;
}

/** Average net sales per trading day in the series. */
export function averagePerDay(daily: DailyPoint[]): number {
  if (daily.length === 0) return 0;
  return daily.reduce((s, d) => s + d.netSales, 0) / daily.length;
}

/** The single highest-selling day in the series. */
export function bestDay(daily: DailyPoint[]): DailyPoint | null {
  if (daily.length === 0) return null;
  return [...daily].sort((a, b) => b.netSales - a.netSales)[0];
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Average net sales per weekday, in Sun..Sat order. */
export function weekdayAverages(daily: DailyPoint[]): { day: string; average: number }[] {
  const totals = new Array(7).fill(0);
  const counts = new Array(7).fill(0);
  for (const d of daily) {
    const dow = new Date(d.date).getUTCDay();
    totals[dow] += d.netSales;
    counts[dow] += 1;
  }
  return WEEKDAY_NAMES.map((day, i) => ({
    day,
    average: counts[i] === 0 ? 0 : totals[i] / counts[i],
  }));
}

/** Trims a series to start at the first day/month with any recorded sales — a
 * branch that opened mid-series shouldn't show a flat run of zeros beforehand. */
export function trimToFirstTrading<T extends { netSales: number }>(series: T[]): T[] {
  const firstIndex = series.findIndex((p) => p.netSales > 0);
  return firstIndex === -1 ? series : series.slice(firstIndex);
}

/** SOP food cost % for one menu item: Σ(qty per portion × ingredient rate) ÷ price. */
export function itemSopFoodCostPct(
  linkedLines: Array<{ qtyPerPortion: number; standardRate: number }>,
  price: number,
): number {
  if (price === 0) return 0;
  const cost = linkedLines.reduce((s, l) => s + l.qtyPerPortion * l.standardRate, 0);
  return (cost / price) * 100;
}
