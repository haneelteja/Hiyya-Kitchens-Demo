import { describe, expect, it } from "vitest";
import {
  applyFixedCostEdit,
  fixedCostForDaysInMonth,
  fixedCostPerDay,
} from "@/lib/calc/fixedCosts";
import { computePnl } from "@/lib/calc/pnl";

describe("fixedCostPerDay", () => {
  it("spreads the monthly total across the days in that month", () => {
    expect(fixedCostPerDay(310_000, 31)).toBeCloseTo(10_000, 6);
  });
});

describe("fixedCostForDaysInMonth", () => {
  it("takes the share of days that fall in the month", () => {
    expect(fixedCostForDaysInMonth(310_000, 31, 4)).toBeCloseTo(40_000, 6);
  });
});

describe("applyFixedCostEdit", () => {
  it("raising Dino rent by ₹78,000 lowers profit by exactly ₹78,000", () => {
    const before = computePnl({
      netSales: 3_668_433,
      actualFoodCost: 1_341_969,
      foodCostAtSop: 1_296_424,
      onlineSalesShare: 0.4,
      fixedCosts: 1_116_871,
      isFranchise: true,
    });

    const currentRent = 335_061; // 30% of the branch's fixed-cost total, per docs/DATA_CONTRACT.md
    const newTotal = applyFixedCostEdit(
      1_116_871,
      "Rent",
      currentRent,
      currentRent + 78_000,
    );
    expect(newTotal).toBe(1_116_871 + 78_000);

    const after = computePnl({
      netSales: 3_668_433,
      actualFoodCost: 1_341_969,
      foodCostAtSop: 1_296_424,
      onlineSalesShare: 0.4,
      fixedCosts: newTotal,
      isFranchise: true,
    });

    expect(before.netProfit - after.netProfit).toBeCloseTo(78_000, 6);
  });
});
