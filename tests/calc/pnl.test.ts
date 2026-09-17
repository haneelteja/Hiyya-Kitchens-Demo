import { describe, expect, it } from "vitest";
import { aggregatePnl, computePnl } from "@/lib/calc/pnl";

describe("computePnl", () => {
  it("brand-owned branch pays no royalty or marketing fund", () => {
    const result = computePnl({
      netSales: 1_000_000,
      actualFoodCost: 350_000,
      foodCostAtSop: 320_000,
      onlineSalesShare: 0.4,
      fixedCosts: 300_000,
      isFranchise: false,
    });
    expect(result.royalty).toBe(0);
    expect(result.marketingFund).toBe(0);
    expect(result.commission).toBeCloseTo(1_000_000 * 0.4 * 0.22, 6);
    expect(result.netProfit).toBeCloseTo(
      1_000_000 - 350_000 - result.commission - 300_000,
      6,
    );
  });

  it("franchise branch pays 6% royalty + 2% marketing fund on net sales", () => {
    const result = computePnl({
      netSales: 1_000_000,
      actualFoodCost: 350_000,
      foodCostAtSop: 320_000,
      onlineSalesShare: 0.4,
      fixedCosts: 300_000,
      isFranchise: true,
    });
    expect(result.royalty).toBeCloseTo(60_000, 6);
    expect(result.marketingFund).toBeCloseTo(20_000, 6);
  });

  it("margin% is netProfit / netSales", () => {
    const result = computePnl({
      netSales: 200_000,
      actualFoodCost: 60_000,
      foodCostAtSop: 55_000,
      onlineSalesShare: 0.5,
      fixedCosts: 80_000,
      isFranchise: false,
    });
    expect(result.marginPct).toBeCloseTo((result.netProfit / 200_000) * 100, 6);
  });
});

describe("aggregatePnl", () => {
  it("sums branch-level results into a brand-level total, weighting % correctly", () => {
    const a = computePnl({
      netSales: 100,
      actualFoodCost: 30,
      foodCostAtSop: 28,
      onlineSalesShare: 0.4,
      fixedCosts: 20,
      isFranchise: false,
    });
    const b = computePnl({
      netSales: 300,
      actualFoodCost: 90,
      foodCostAtSop: 85,
      onlineSalesShare: 0.4,
      fixedCosts: 60,
      isFranchise: true,
    });
    const agg = aggregatePnl([a, b]);
    expect(agg.netSales).toBe(400);
    expect(agg.actualFoodCost).toBe(120);
    expect(agg.actualFoodCostPct).toBeCloseTo((120 / 400) * 100, 6);
    expect(agg.netProfit).toBeCloseTo(a.netProfit + b.netProfit, 6);
  });
});
