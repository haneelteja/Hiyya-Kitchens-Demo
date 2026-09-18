import type {
  Branch,
  BranchCode,
  FixedCost,
  MenuItem,
  Purchase,
  RevenueShareTerm,
  Scope,
  SopLine,
  StockOnHand,
  WastageEntry,
} from "@/lib/data/types";
import type { DeviationFlag } from "@/lib/calc/sop";
import type { PnlResult } from "@/lib/calc/pnl";
import type { HealthStatus } from "@/lib/calc/health";

export type Grain = "daily" | "weekly" | "monthly";

export interface PnlSeriesPoint {
  period: string; // ISO date (daily) or "YYYY-MM" (monthly) or ISO week start (weekly)
  netSales: number;
  actualFoodCost: number;
  netProfit: number;
}

export interface IngredientVarianceRow {
  branchCode: BranchCode;
  ingredientKey: string;
  ingredientName: string;
  unit: string;
  sopUsageQty: number;
  actualUsageQty: number;
  wastageQty: number;
  unexplainedQty: number;
  deviationPct: number;
  unexplainedValue: number;
  wastageValue: number;
  flag: DeviationFlag;
}

export interface BranchRankRow {
  branchCode: BranchCode;
  branchName: string;
  value: number;
  rank: number;
}

export interface TodaySnapshot {
  branchCode: BranchCode;
  netSalesToday: number;
  target: number;
  reorderCount: number;
  wastageLoggedToday: number;
}

export interface BranchHealth {
  branchCode: BranchCode;
  marginPct: number;
  deviationPct: number;
  status: HealthStatus;
}

export interface BranchDaySales {
  branchCode: BranchCode;
  branchName: string;
  date: string;
  netSales: number;
}

export interface WeekdayAverage {
  day: string;
  average: number;
}

export interface TopItemRow {
  code: string;
  name: string;
  category: string;
  estQty: number;
  estSales: number;
  sopFoodCostPct: number;
}

export interface ChannelShareRow {
  channel: string;
  pct: number;
}

export interface ExpenseStructureRow {
  branchCode: BranchCode;
  branchName: string;
  foodCostPct: number;
  commissionPct: number;
  fixedCostsPct: number;
  royaltyFundPct: number;
  profitPct: number;
}

export interface FixedCostHeadRow {
  head: string;
  amount: number;
}

export interface WastageReasonRow {
  reason: string;
  value: number;
}

export interface LeagueTableRow {
  branchCode: BranchCode;
  branchName: string;
  themeColorToken: string;
  monthlySales: number[]; // sparkline, oldest to newest
  netSales: number;
  marginPct: number;
  health: HealthStatus;
  rank: number;
}

export interface RevenueShareRow {
  branchCode: BranchCode;
  branchName: string;
  netSales: number;
  sharePct: number; // this branch's share of brand-wide net sales
  royaltyPct: number;
  royalty: number;
  marketingFundPct: number;
  marketingFund: number;
  totalToBrand: number;
  branchProfit: number;
}

/**
 * The one seam between the UI and where data actually lives. MockDataSource
 * implements this against lib/data/demo.json today; SupabaseDataSource (Stage B)
 * implements the same interface against Postgres/RLS. No component should ever
 * import lib/data/demo.json or a Supabase client directly — only this.
 */
export interface DataSource {
  getBranches(scope: Scope): Promise<Branch[]>;
  getMenuItems(): Promise<MenuItem[]>;
  getSopLines(): Promise<SopLine[]>;

  getPnlSummary(scope: Scope, period: string): Promise<PnlResult>;
  getPnlByBranch(scope: Scope, period: string): Promise<Record<BranchCode, PnlResult>>;
  getPnlSeries(scope: Scope, grain: Grain, period: string): Promise<PnlSeriesPoint[]>;

  getIngredientVariance(scope: Scope, period: string): Promise<IngredientVarianceRow[]>;
  getRank(
    scope: Scope,
    metric: "netSales" | "netProfit" | "marginPct" | "sopDeviationPct",
    period: string,
  ): Promise<BranchRankRow[]>;
  getBranchHealth(scope: Scope, period: string): Promise<BranchHealth[]>;

  getFixedCosts(branchCode: BranchCode, month: string): Promise<FixedCost[]>;
  getRevenueShareTerm(branchCode: BranchCode): Promise<RevenueShareTerm>;

  getTodaySnapshot(branchCode: BranchCode): Promise<TodaySnapshot>;
  getStockOnHand(branchCode: BranchCode): Promise<StockOnHand[]>;
  getPurchases(branchCode: BranchCode, month: string): Promise<Purchase[]>;
  getWastageEntries(branchCode: BranchCode, month: string): Promise<WastageEntry[]>;

  // --- Sales tab ---
  getDailySalesByBranch(scope: Scope, period: string): Promise<BranchDaySales[]>;
  getWeekdayAverages(scope: Scope, period: string): Promise<WeekdayAverage[]>;
  getTopItems(
    scope: Scope,
    period: string,
    sortBy: "sales" | "qty",
  ): Promise<TopItemRow[]>;
  getChannelMix(scope: Scope, period: string): Promise<ChannelShareRow[]>;

  // --- Expenses & profit tab ---
  getExpenseStructureByBranch(
    scope: Scope,
    period: string,
  ): Promise<ExpenseStructureRow[]>;
  getFixedCostsByHead(scope: Scope, period: string): Promise<FixedCostHeadRow[]>;

  // --- SOP & wastage tab ---
  getWastageByReason(scope: Scope, period: string): Promise<WastageReasonRow[]>;

  // --- Branches tab ---
  getLeagueTable(scope: Scope, period: string): Promise<LeagueTableRow[]>;

  // --- Revenue share tab ---
  getRevenueShareSummary(scope: Scope, period: string): Promise<RevenueShareRow[]>;
}
