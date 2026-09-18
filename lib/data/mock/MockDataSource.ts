import { dataset } from "@/lib/data/mock/dataset";
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
import type {
  BranchDaySales,
  BranchHealth,
  BranchRankRow,
  ChannelShareRow,
  DataSource,
  ExpenseStructureRow,
  FixedCostHeadRow,
  Grain,
  IngredientVarianceRow,
  LeagueTableRow,
  PnlSeriesPoint,
  RevenueShareRow,
  TodaySnapshot,
  TopItemRow,
  WastageReasonRow,
  WeekdayAverage,
} from "@/lib/data/DataSource";
import { resolveScopeToBranchCodes } from "@/lib/access/scope";
import { computeDeviation } from "@/lib/calc/sop";
import { computeReorderStatus } from "@/lib/calc/stock";
import { aggregatePnl, computePnl, type PnlResult } from "@/lib/calc/pnl";
import { sumFixedCosts } from "@/lib/calc/fixedCosts";
import { computeHealth } from "@/lib/calc/health";
import { rankBy } from "@/lib/calc/ranks";
import { itemSopFoodCostPct, weekdayAverages } from "@/lib/calc/sales";
import { wastageByReasonSplit } from "@/lib/calc/wastage";
import { expenseStructurePct } from "@/lib/calc/expenseStructure";
import { computeRevenueShare } from "@/lib/calc/revenueShare";

const IS_FRANCHISE: Record<BranchCode, boolean> = {
  B01: false,
  B02: true,
  B03: true,
  B04: true,
};

function branchName(code: BranchCode): string {
  return dataset.branches.find((b) => b.code === code)?.name ?? code;
}

function pnlForBranch(branchCode: BranchCode, period: string): PnlResult {
  const row = dataset.monthlyPnl.find(
    (p) => p.branchCode === branchCode && p.month === period,
  );
  if (!row) {
    throw new Error(`No monthly P&L for ${branchCode} in ${period}`);
  }
  const fixedCosts = sumFixedCosts(dataset.fixedCosts as FixedCost[], branchCode, period);
  if (period === "2026-08") {
    // Aug has real fixed-cost head data (reconciled to Section 10) — use it directly.
    return computePnl({
      netSales: row.netSales,
      actualFoodCost: row.actualFoodCost,
      foodCostAtSop: row.foodCostAtSop,
      onlineSalesShare: row.onlineSalesShare,
      fixedCosts,
      isFranchise: IS_FRANCHISE[branchCode],
    });
  }
  // Earlier months: no stored fixed-cost breakdown yet (demo trend data only — see
  // docs/DATA_CONTRACT.md). Apply Aug's non-food-cost burden ratio to this month's
  // sales so historical trend charts still reconcile internally.
  const aug = dataset.monthlyPnl.find(
    (p) => p.branchCode === branchCode && p.month === "2026-08",
  )!;
  const augNonFoodBurdenRatio =
    (aug.netSales - aug.actualFoodCost - pnlForBranch(branchCode, "2026-08").netProfit) /
    aug.netSales;
  const estimatedFixedAndFees = augNonFoodBurdenRatio * row.netSales;
  const netProfit = row.netSales - row.actualFoodCost - estimatedFixedAndFees;
  return {
    netSales: row.netSales,
    actualFoodCost: row.actualFoodCost,
    foodCostAtSop: row.foodCostAtSop,
    actualFoodCostPct: (row.actualFoodCost / row.netSales) * 100,
    sopFoodCostPct: (row.foodCostAtSop / row.netSales) * 100,
    commission: row.netSales * row.onlineSalesShare * 0.22,
    royalty: IS_FRANCHISE[branchCode] ? row.netSales * 0.06 : 0,
    marketingFund: IS_FRANCHISE[branchCode] ? row.netSales * 0.02 : 0,
    fixedCosts:
      estimatedFixedAndFees -
      (IS_FRANCHISE[branchCode] ? row.netSales * 0.08 : 0) -
      row.netSales * row.onlineSalesShare * 0.22,
    netProfit,
    marginPct: (netProfit / row.netSales) * 100,
  };
}

function ingredientVarianceForBranch(
  branchCode: BranchCode,
  period: string,
): IngredientVarianceRow[] {
  return dataset.ingredientUsageAug
    .filter((r) => r.branchCode === branchCode && r.period === period)
    .map((r) => {
      const ingredient = dataset.ingredients.find((i) => i.key === r.ingredientKey)!;
      const dev = computeDeviation(r, ingredient.standardRate);
      return {
        branchCode,
        ingredientKey: r.ingredientKey,
        ingredientName: ingredient.name,
        unit: ingredient.unit,
        sopUsageQty: r.sopUsageQty,
        actualUsageQty: r.actualUsageQty,
        wastageQty: r.wastageQty,
        unexplainedQty: dev.unexplainedQty,
        deviationPct: dev.deviationPct,
        unexplainedValue: dev.unexplainedValue,
        wastageValue: r.wastageQty * ingredient.standardRate,
        flag: dev.flag,
      };
    });
}

export class MockDataSource implements DataSource {
  async getBranches(scope: Scope): Promise<Branch[]> {
    const codes = this.resolveCodes(scope);
    return dataset.branches.filter((b) => codes.includes(b.code));
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return dataset.menuItems;
  }

  async getSopLines(): Promise<SopLine[]> {
    return dataset.sopLines;
  }

  async getPnlSummary(scope: Scope, period: string) {
    const codes = this.resolveCodes(scope);
    return aggregatePnl(codes.map((c) => pnlForBranch(c, period))) as PnlResult;
  }

  async getPnlByBranch(scope: Scope, period: string) {
    const codes = this.resolveCodes(scope);
    const out = {} as Record<BranchCode, PnlResult>;
    for (const c of codes) out[c] = pnlForBranch(c, period);
    return out;
  }

  async getPnlSeries(
    scope: Scope,
    grain: Grain,
    period: string,
  ): Promise<PnlSeriesPoint[]> {
    const codes = this.resolveCodes(scope);
    if (grain === "monthly") {
      const months = [...new Set(dataset.monthlyPnl.map((p) => p.month))].sort();
      return months.map((month) => {
        const pnls = codes
          .filter((c) =>
            dataset.monthlyPnl.some((p) => p.branchCode === c && p.month === month),
          )
          .map((c) => pnlForBranch(c, month));
        const agg = aggregatePnl(pnls);
        return {
          period: month,
          netSales: agg.netSales,
          actualFoodCost: agg.actualFoodCost,
          netProfit: agg.netProfit,
        };
      });
    }

    // Daily (and weekly, aggregated from daily): only Aug has day-level data.
    const daily = dataset.dailySalesAug.filter((d) => codes.includes(d.branchCode));
    const byDate = new Map<string, number>();
    for (const d of daily) byDate.set(d.date, (byDate.get(d.date) ?? 0) + d.netSales);

    const summary = await this.getPnlSummary(scope, period);
    const foodCostRatio =
      summary.netSales === 0 ? 0 : summary.actualFoodCost / summary.netSales;
    const marginRatio = summary.netSales === 0 ? 0 : summary.netProfit / summary.netSales;

    const dailyPoints: PnlSeriesPoint[] = [...byDate.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, netSales]) => ({
        period: date,
        netSales,
        actualFoodCost: netSales * foodCostRatio,
        netProfit: netSales * marginRatio,
      }));

    if (grain === "daily") return dailyPoints;

    // Weekly: bucket the 30 daily points into 5 chunks of ~7 days.
    const weeks: PnlSeriesPoint[] = [];
    for (let i = 0; i < dailyPoints.length; i += 7) {
      const chunk = dailyPoints.slice(i, i + 7);
      weeks.push({
        period: chunk[0].period,
        netSales: chunk.reduce((s, p) => s + p.netSales, 0),
        actualFoodCost: chunk.reduce((s, p) => s + p.actualFoodCost, 0),
        netProfit: chunk.reduce((s, p) => s + p.netProfit, 0),
      });
    }
    return weeks;
  }

  async getIngredientVariance(
    scope: Scope,
    period: string,
  ): Promise<IngredientVarianceRow[]> {
    const codes = this.resolveCodes(scope);
    return codes.flatMap((c) => ingredientVarianceForBranch(c, period));
  }

  async getRank(
    scope: Scope,
    metric: Parameters<DataSource["getRank"]>[1],
    period: string,
  ) {
    const codes = this.resolveCodes(scope);
    const lowerIsBetter = metric === "sopDeviationPct";
    const values = codes.map((c) => {
      if (metric === "sopDeviationPct") {
        const rows = ingredientVarianceForBranch(c, period);
        const totalSopValue = rows.reduce(
          (s, r) =>
            s +
            r.sopUsageQty *
              (dataset.ingredients.find((i) => i.key === r.ingredientKey)?.standardRate ??
                0),
          0,
        );
        const totalUnexplained = rows.reduce((s, r) => s + r.unexplainedValue, 0);
        return {
          code: c,
          value: totalSopValue === 0 ? 0 : (totalUnexplained / totalSopValue) * 100,
        };
      }
      const pnl = pnlForBranch(c, period);
      const value =
        metric === "netSales"
          ? pnl.netSales
          : metric === "netProfit"
            ? pnl.netProfit
            : pnl.marginPct;
      return { code: c, value };
    });
    const ranked = rankBy(values, (v) => v.value, { lowerIsBetter });
    return ranked.map((r): BranchRankRow => ({
      branchCode: r.item.code,
      branchName: branchName(r.item.code),
      value: r.value,
      rank: r.rank,
    }));
  }

  async getBranchHealth(scope: Scope, period: string): Promise<BranchHealth[]> {
    const codes = this.resolveCodes(scope);
    return codes.map((c) => {
      const pnl = pnlForBranch(c, period);
      const rows = ingredientVarianceForBranch(c, period);
      const totalSopValue = rows.reduce(
        (s, r) =>
          s +
          r.sopUsageQty *
            (dataset.ingredients.find((i) => i.key === r.ingredientKey)?.standardRate ??
              0),
        0,
      );
      const totalUnexplained = rows.reduce((s, r) => s + r.unexplainedValue, 0);
      const deviationPct =
        totalSopValue === 0 ? 0 : (totalUnexplained / totalSopValue) * 100;
      return {
        branchCode: c,
        marginPct: pnl.marginPct,
        deviationPct,
        status: computeHealth(pnl.marginPct, deviationPct),
      };
    });
  }

  async getFixedCosts(branchCode: BranchCode, month: string): Promise<FixedCost[]> {
    return dataset.fixedCosts.filter(
      (f) => f.branchCode === branchCode && f.month === month,
    );
  }

  async getRevenueShareTerm(branchCode: BranchCode): Promise<RevenueShareTerm> {
    const term = dataset.revenueShareTerms.find((t) => t.branchCode === branchCode);
    if (!term) throw new Error(`No revenue-share term for ${branchCode}`);
    return term;
  }

  async getTodaySnapshot(branchCode: BranchCode): Promise<TodaySnapshot> {
    // Demo date is Monday 31 Aug 2026 (Section 3) — "today" is the last day of the
    // Aug daily series.
    const todayRow = dataset.dailySalesAug.find(
      (d) => d.branchCode === branchCode && d.date === "2026-08-31",
    );
    const netSalesToday = todayRow?.netSales ?? 0;
    const sameWeekday = dataset.dailySalesAug.filter((d) => {
      if (d.branchCode !== branchCode) return false;
      return new Date(d.date).getUTCDay() === 1; // Monday
    });
    const avg =
      sameWeekday.reduce((s, d) => s + d.netSales, 0) / (sameWeekday.length || 1);
    const target = avg * 1.05;
    const stock = await this.getStockOnHand(branchCode);
    const reorderCount = stock.filter(
      (s) => computeReorderStatus(s.qtyOnHand, s.avgDailyUsage).status !== "ok",
    ).length;
    const wastageToday = dataset.wastageEntries.filter(
      (w) => w.branchCode === branchCode && w.date === "2026-08-31",
    );
    const wastageLoggedToday = wastageToday.reduce((s, w) => {
      const rate =
        dataset.ingredients.find((i) => i.key === w.ingredientKey)?.standardRate ?? 0;
      return s + w.qty * rate;
    }, 0);
    return { branchCode, netSalesToday, target, reorderCount, wastageLoggedToday };
  }

  async getStockOnHand(branchCode: BranchCode): Promise<StockOnHand[]> {
    return dataset.stockOnHand.filter((s) => s.branchCode === branchCode);
  }

  async getPurchases(branchCode: BranchCode, month: string): Promise<Purchase[]> {
    return dataset.purchases.filter(
      (p) => p.branchCode === branchCode && p.date.startsWith(month),
    );
  }

  async getWastageEntries(
    branchCode: BranchCode,
    month: string,
  ): Promise<WastageEntry[]> {
    return dataset.wastageEntries.filter(
      (w) => w.branchCode === branchCode && w.date.startsWith(month),
    );
  }

  async getDailySalesByBranch(scope: Scope, period: string): Promise<BranchDaySales[]> {
    if (period !== "2026-08") return []; // only Aug has day-level data (see DATA_CONTRACT)
    const codes = this.resolveCodes(scope);
    return dataset.dailySalesAug
      .filter((d) => codes.includes(d.branchCode))
      .map((d) => ({ ...d, branchName: branchName(d.branchCode) }));
  }

  async getWeekdayAverages(scope: Scope, period: string): Promise<WeekdayAverage[]> {
    const daily = await this.getDailySalesByBranch(scope, period);
    const byDate = new Map<string, number>();
    for (const d of daily) byDate.set(d.date, (byDate.get(d.date) ?? 0) + d.netSales);
    const combined = [...byDate.entries()].map(([date, netSales]) => ({
      date,
      netSales,
    }));
    return weekdayAverages(combined);
  }

  async getTopItems(
    scope: Scope,
    period: string,
    sortBy: "sales" | "qty",
  ): Promise<TopItemRow[]> {
    const summary = await this.getPnlSummary(scope, period);
    // No per-sale POS data yet (Q01/Q02) — a documented, decreasing-share estimate
    // across the menu, calibrated so the top item takes ~6% of net sales and each
    // item after it a little less, never claiming to be a real item-level ledger.
    const rows: TopItemRow[] = dataset.menuItems.map((item, i) => {
      const estSales = Math.round(summary.netSales * 0.06 * Math.max(0.15, 1 - i * 0.11));
      const estQty = item.price === 0 ? 0 : Math.round(estSales / item.price);
      const linkedLines = dataset.sopLines
        .filter((l) => l.menuItemCode === item.code && l.appliesTo === "ALL")
        .map((l) => ({
          qtyPerPortion: l.qtyPerPortion,
          standardRate:
            dataset.ingredients.find((ing) => ing.key === l.ingredientKey)
              ?.standardRate ?? 0,
        }));
      return {
        code: item.code,
        name: item.name,
        category: item.category,
        estQty,
        estSales,
        sopFoodCostPct: itemSopFoodCostPct(linkedLines, item.price),
      };
    });
    return rows.sort((a, b) =>
      sortBy === "sales" ? b.estSales - a.estSales : b.estQty - a.estQty,
    );
  }

  async getChannelMix(scope: Scope, period: string): Promise<ChannelShareRow[]> {
    const codes = this.resolveCodes(scope);
    const rows = dataset.channelShares.filter(
      (c) => codes.includes(c.branchCode) && c.month === period,
    );
    const weights = new Map<string, number>();
    for (const c of codes) {
      const pnl = pnlForBranch(c, period);
      weights.set(c, pnl.netSales);
    }
    const totalWeight = [...weights.values()].reduce((a, b) => a + b, 0) || 1;
    const byChannel = new Map<string, number>();
    for (const row of rows) {
      const w = (weights.get(row.branchCode) ?? 0) / totalWeight;
      byChannel.set(row.channel, (byChannel.get(row.channel) ?? 0) + row.pct * w * 100);
    }
    return [...byChannel.entries()].map(([channel, pct]) => ({ channel, pct }));
  }

  async getExpenseStructureByBranch(
    scope: Scope,
    period: string,
  ): Promise<ExpenseStructureRow[]> {
    const codes = this.resolveCodes(scope);
    return codes.map((c) => ({
      branchCode: c,
      branchName: branchName(c),
      ...expenseStructurePct(pnlForBranch(c, period)),
    }));
  }

  async getFixedCostsByHead(scope: Scope, period: string): Promise<FixedCostHeadRow[]> {
    const codes = this.resolveCodes(scope);
    const byHead = new Map<string, number>();
    for (const f of dataset.fixedCosts) {
      if (!codes.includes(f.branchCode) || f.month !== period) continue;
      byHead.set(f.head, (byHead.get(f.head) ?? 0) + f.amount);
    }
    return [...byHead.entries()].map(([head, amount]) => ({ head, amount }));
  }

  async getWastageByReason(scope: Scope, period: string): Promise<WastageReasonRow[]> {
    const rows = await this.getIngredientVariance(scope, period);
    const total = rows.reduce((s, r) => s + r.wastageValue, 0);
    return wastageByReasonSplit(total);
  }

  async getLeagueTable(scope: Scope, period: string): Promise<LeagueTableRow[]> {
    const codes = this.resolveCodes(scope);
    const health = await this.getBranchHealth(scope, period);
    const months = [...new Set(dataset.monthlyPnl.map((p) => p.month))].sort();
    const rowsUnranked = codes.map((c) => {
      const branch = dataset.branches.find((b) => b.code === c)!;
      const monthlySales = months
        .filter((m) =>
          dataset.monthlyPnl.some((p) => p.branchCode === c && p.month === m),
        )
        .map((m) => pnlForBranch(c, m).netSales);
      const pnl = pnlForBranch(c, period);
      const h = health.find((x) => x.branchCode === c);
      return {
        branchCode: c,
        branchName: branch.name,
        themeColorToken:
          dataset.themes.find((t) => t.branchCode === c)?.colorToken ?? "gold",
        monthlySales,
        netSales: pnl.netSales,
        marginPct: pnl.marginPct,
        health: h?.status ?? "healthy",
      };
    });
    const ranked = rankBy(rowsUnranked, (r) => r.netSales);
    return ranked.map((r): LeagueTableRow => ({ ...r.item, rank: r.rank }));
  }

  async getRevenueShareSummary(scope: Scope, period: string): Promise<RevenueShareRow[]> {
    const codes = this.resolveCodes(scope);
    const allCodes = dataset.branches.map((b) => b.code);
    const brandTotalSales = allCodes.reduce(
      (s, c) => s + pnlForBranch(c, period).netSales,
      0,
    );
    return Promise.all(
      codes.map(async (c) => {
        const pnl = pnlForBranch(c, period);
        const term = await this.getRevenueShareTerm(c);
        const share = computeRevenueShare(pnl.netSales, term);
        return {
          branchCode: c,
          branchName: branchName(c),
          netSales: pnl.netSales,
          sharePct: brandTotalSales === 0 ? 0 : (pnl.netSales / brandTotalSales) * 100,
          royaltyPct: share.royaltyPct * 100,
          royalty: share.royalty,
          marketingFundPct: share.marketingFundPct * 100,
          marketingFund: share.marketingFund,
          totalToBrand: share.totalToBrand,
          branchProfit: pnl.netProfit,
        };
      }),
    );
  }

  private resolveCodes(scope: Scope): BranchCode[] {
    // DataSource never sees a Persona and performs no access control of its own —
    // by the time a Scope reaches here, lib/access/scope's accessibleBranchCodes(
    // persona, scope) has already restricted it to what that persona may see. This
    // just resolves the (already-safe) Scope down to concrete branch codes.
    return resolveScopeToBranchCodes(scope);
  }
}
