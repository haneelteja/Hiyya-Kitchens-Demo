/**
 * Net profit = sales − actual food cost − aggregator commission (online share × 22%)
 *            − fixed costs − (royalty 6% + marketing fund 2% for franchises).
 */
export interface PnlInput {
  netSales: number;
  actualFoodCost: number;
  foodCostAtSop: number;
  onlineSalesShare: number;
  fixedCosts: number;
  isFranchise: boolean;
  commissionRate?: number;
  royaltyRate?: number;
  marketingFundRate?: number;
}

export interface PnlResult {
  netSales: number;
  actualFoodCost: number;
  foodCostAtSop: number;
  actualFoodCostPct: number;
  sopFoodCostPct: number;
  commission: number;
  royalty: number;
  marketingFund: number;
  fixedCosts: number;
  netProfit: number;
  marginPct: number;
}

const DEFAULT_COMMISSION_RATE = 0.22;
const DEFAULT_ROYALTY_RATE = 0.06;
const DEFAULT_MARKETING_FUND_RATE = 0.02;

export function computePnl(input: PnlInput): PnlResult {
  const commissionRate = input.commissionRate ?? DEFAULT_COMMISSION_RATE;
  const royaltyRate = input.isFranchise ? (input.royaltyRate ?? DEFAULT_ROYALTY_RATE) : 0;
  const fundRate = input.isFranchise
    ? (input.marketingFundRate ?? DEFAULT_MARKETING_FUND_RATE)
    : 0;

  const commission = input.netSales * input.onlineSalesShare * commissionRate;
  const royalty = input.netSales * royaltyRate;
  const marketingFund = input.netSales * fundRate;
  const netProfit =
    input.netSales -
    input.actualFoodCost -
    commission -
    input.fixedCosts -
    royalty -
    marketingFund;

  return {
    netSales: input.netSales,
    actualFoodCost: input.actualFoodCost,
    foodCostAtSop: input.foodCostAtSop,
    actualFoodCostPct: safeDiv(input.actualFoodCost, input.netSales) * 100,
    sopFoodCostPct: safeDiv(input.foodCostAtSop, input.netSales) * 100,
    commission,
    royalty,
    marketingFund,
    fixedCosts: input.fixedCosts,
    netProfit,
    marginPct: safeDiv(netProfit, input.netSales) * 100,
  };
}

function safeDiv(a: number, b: number): number {
  return b === 0 ? 0 : a / b;
}

/** Sums a set of per-branch PnlResults into one brand-level PnlResult-shaped total. */
export function aggregatePnl(results: PnlResult[]): Omit<
  PnlResult,
  "actualFoodCostPct" | "sopFoodCostPct" | "marginPct"
> & {
  actualFoodCostPct: number;
  sopFoodCostPct: number;
  marginPct: number;
} {
  const sum = (key: keyof PnlResult) =>
    results.reduce((a, r) => a + (r[key] as number), 0);
  const netSales = sum("netSales");
  const actualFoodCost = sum("actualFoodCost");
  const foodCostAtSop = sum("foodCostAtSop");
  const netProfit = sum("netProfit");
  return {
    netSales,
    actualFoodCost,
    foodCostAtSop,
    actualFoodCostPct: safeDiv(actualFoodCost, netSales) * 100,
    sopFoodCostPct: safeDiv(foodCostAtSop, netSales) * 100,
    commission: sum("commission"),
    royalty: sum("royalty"),
    marketingFund: sum("marketingFund"),
    fixedCosts: sum("fixedCosts"),
    netProfit,
    marginPct: safeDiv(netProfit, netSales) * 100,
  };
}
