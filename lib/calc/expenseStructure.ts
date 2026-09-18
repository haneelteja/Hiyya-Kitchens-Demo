import type { PnlResult } from "@/lib/calc/pnl";

export interface ExpenseStructure {
  foodCostPct: number;
  commissionPct: number;
  fixedCostsPct: number;
  royaltyFundPct: number;
  profitPct: number;
}

/** Every branch's P&L expressed as a % of its own net sales, for a 100%-stacked
 * expense-structure-by-branch chart (Section 8). */
export function expenseStructurePct(pnl: PnlResult): ExpenseStructure {
  if (pnl.netSales === 0) {
    return {
      foodCostPct: 0,
      commissionPct: 0,
      fixedCostsPct: 0,
      royaltyFundPct: 0,
      profitPct: 0,
    };
  }
  return {
    foodCostPct: (pnl.actualFoodCost / pnl.netSales) * 100,
    commissionPct: (pnl.commission / pnl.netSales) * 100,
    fixedCostsPct: (pnl.fixedCosts / pnl.netSales) * 100,
    royaltyFundPct: ((pnl.royalty + pnl.marketingFund) / pnl.netSales) * 100,
    profitPct: (pnl.netProfit / pnl.netSales) * 100,
  };
}
