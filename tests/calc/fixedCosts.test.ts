import { describe, expect, it } from "vitest";
import {
  applyFixedCostEdit,
  applyOverridesToFixedCosts,
  fixedCostForDaysInMonth,
  fixedCostPerDay,
  sumFixedCosts,
} from "@/lib/calc/fixedCosts";
import { computePnl } from "@/lib/calc/pnl";
import type { FixedCost } from "@/lib/data/types";

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

describe("applyOverridesToFixedCosts", () => {
  const costs: FixedCost[] = [
    {
      branchCode: "B02",
      month: "2026-08",
      head: "Rent",
      amount: 335_061,
      enteredBy: "demo",
    },
    {
      branchCode: "B02",
      month: "2026-08",
      head: "Salaries",
      amount: 446_748,
      enteredBy: "demo",
    },
  ];

  it("replaces only the overridden head's amount", () => {
    const result = applyOverridesToFixedCosts(costs, { Rent: 413_061 });
    expect(result.find((c) => c.head === "Rent")?.amount).toBe(413_061);
    expect(result.find((c) => c.head === "Salaries")?.amount).toBe(446_748);
  });

  it("does not mutate the input array", () => {
    applyOverridesToFixedCosts(costs, { Rent: 999 });
    expect(costs.find((c) => c.head === "Rent")?.amount).toBe(335_061);
  });

  it("with no overrides, the total is unchanged", () => {
    const result = applyOverridesToFixedCosts(costs, {});
    expect(sumFixedCosts(result, "B02", "2026-08")).toBe(
      sumFixedCosts(costs, "B02", "2026-08"),
    );
  });

  it("composes with the Dino rent +₹78,000 acceptance case via sumFixedCosts", () => {
    const result = applyOverridesToFixedCosts(costs, { Rent: 335_061 + 78_000 });
    const newTotal = sumFixedCosts(result, "B02", "2026-08");
    expect(newTotal - sumFixedCosts(costs, "B02", "2026-08")).toBe(78_000);
  });
});
