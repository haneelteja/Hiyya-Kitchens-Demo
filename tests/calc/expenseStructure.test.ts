import { describe, expect, it } from "vitest";
import { expenseStructurePct } from "@/lib/calc/expenseStructure";
import { computePnl } from "@/lib/calc/pnl";

describe("expenseStructurePct", () => {
  it("expresses every P&L line as a % of net sales", () => {
    const pnl = computePnl({
      netSales: 1_000_000,
      actualFoodCost: 350_000,
      foodCostAtSop: 320_000,
      onlineSalesShare: 0.4,
      fixedCosts: 300_000,
      isFranchise: true,
    });
    const structure = expenseStructurePct(pnl);
    expect(structure.foodCostPct).toBeCloseTo(35, 6);
    expect(structure.fixedCostsPct).toBeCloseTo(30, 6);
    expect(structure.royaltyFundPct).toBeCloseTo(8, 6);
    const total =
      structure.foodCostPct +
      structure.commissionPct +
      structure.fixedCostsPct +
      structure.royaltyFundPct +
      structure.profitPct;
    expect(total).toBeCloseTo(100, 6);
  });
});
