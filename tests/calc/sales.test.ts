import { describe, expect, it } from "vitest";
import {
  averagePerDay,
  bestDay,
  itemSopFoodCostPct,
  trimToFirstTrading,
  weekdayAverages,
} from "@/lib/calc/sales";

const DAILY = [
  { date: "2026-08-01", netSales: 100 }, // Saturday
  { date: "2026-08-02", netSales: 200 }, // Sunday
  { date: "2026-08-03", netSales: 50 }, // Monday
  { date: "2026-08-10", netSales: 150 }, // Monday
];

describe("averagePerDay", () => {
  it("averages net sales across the series", () => {
    expect(averagePerDay(DAILY)).toBeCloseTo(125, 6);
  });
  it("is 0 for an empty series", () => {
    expect(averagePerDay([])).toBe(0);
  });
});

describe("bestDay", () => {
  it("finds the single highest-selling day", () => {
    expect(bestDay(DAILY)?.date).toBe("2026-08-02");
  });
  it("is null for an empty series", () => {
    expect(bestDay([])).toBeNull();
  });
});

describe("weekdayAverages", () => {
  it("averages same-weekday sales, Sun..Sat", () => {
    const result = weekdayAverages(DAILY);
    const monday = result.find((r) => r.day === "Mon");
    expect(monday?.average).toBeCloseTo((50 + 150) / 2, 6);
    const sunday = result.find((r) => r.day === "Sun");
    expect(sunday?.average).toBeCloseTo(200, 6);
    const friday = result.find((r) => r.day === "Fri");
    expect(friday?.average).toBe(0);
  });
});

describe("trimToFirstTrading", () => {
  it("drops leading zero-sales entries", () => {
    const series = [
      { netSales: 0 },
      { netSales: 0 },
      { netSales: 500 },
      { netSales: 600 },
    ];
    expect(trimToFirstTrading(series)).toEqual([{ netSales: 500 }, { netSales: 600 }]);
  });
  it("returns the series unchanged if it never has a zero lead-in", () => {
    const series = [{ netSales: 10 }, { netSales: 20 }];
    expect(trimToFirstTrading(series)).toEqual(series);
  });
});

describe("itemSopFoodCostPct", () => {
  it("is Σ(qty per portion x rate) / price x 100", () => {
    const pct = itemSopFoodCostPct(
      [
        { qtyPerPortion: 0.35, standardRate: 210 },
        { qtyPerPortion: 0.28, standardRate: 65 },
      ],
      320,
    );
    expect(pct).toBeCloseTo(((0.35 * 210 + 0.28 * 65) / 320) * 100, 6);
  });
});
