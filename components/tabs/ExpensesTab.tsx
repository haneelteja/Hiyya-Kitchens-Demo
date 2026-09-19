"use client";

import { useEffect, useState } from "react";
import { useDataSource } from "@/hooks/useDataSource";
import { useAccessibleScope } from "@/hooks/useAccessibleScope";
import { useAppStore } from "@/lib/store/useAppStore";
import { KpiCard } from "@/components/kpi/KpiCard";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { WaterfallChart, type WaterfallStep } from "@/components/charts/WaterfallChart";
import { TrendChart, type TrendPoint } from "@/components/charts/TrendChart";
import { BreakEvenChart } from "@/components/charts/BreakEvenChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import { TabSkeleton } from "@/components/kpi/TabSkeleton";
import { formatInr, formatMonthLabel } from "@/lib/calc/format";
import { fixedCostPerDay } from "@/lib/calc/fixedCosts";
import { goldRamp, hiyyaColors } from "@/lib/theme/tokens";
import type { BranchCode } from "@/lib/data/types";
import type {
  BranchDaySales,
  ExpenseStructureRow,
  FixedCostHeadRow,
  PnlSeriesPoint,
} from "@/lib/data/DataSource";
import type { PnlResult } from "@/lib/calc/pnl";

const PERIOD = "2026-08";
const DAYS_IN_AUG = 31;

export function ExpensesTab() {
  const ds = useDataSource();
  const { scope } = useAccessibleScope();
  const openBranchDrilldown = useAppStore((s) => s.openBranchDrilldown);

  const [summary, setSummary] = useState<PnlResult | null>(null);
  const [monthly, setMonthly] = useState<PnlSeriesPoint[]>([]);
  const [daily, setDaily] = useState<BranchDaySales[]>([]);
  const [heads, setHeads] = useState<FixedCostHeadRow[]>([]);
  const [structure, setStructure] = useState<ExpenseStructureRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    ds.getPnlSummary(scope, PERIOD).then((s) => !cancelled && setSummary(s));
    ds.getPnlSeries(scope, "monthly", PERIOD).then((s) => !cancelled && setMonthly(s));
    ds.getDailySalesByBranch(scope, PERIOD).then((d) => !cancelled && setDaily(d));
    ds.getFixedCostsByHead(scope, PERIOD).then((h) => !cancelled && setHeads(h));
    ds.getExpenseStructureByBranch(scope, PERIOD).then(
      (r) => !cancelled && setStructure(r),
    );
    return () => {
      cancelled = true;
    };
  }, [ds, scope]);

  if (!summary) return <TabSkeleton kpis={4} panels={3} />;

  const waterfallSteps: WaterfallStep[] = [
    { label: "Net sales", value: summary.netSales },
    { label: "Food cost (SOP)", value: -summary.foodCostAtSop },
    {
      label: "Wastage & deviation",
      value: -(summary.actualFoodCost - summary.foodCostAtSop),
    },
    { label: "Aggregator commission", value: -summary.commission },
    { label: "Fixed costs", value: -summary.fixedCosts },
    { label: "Royalty & fund", value: -(summary.royalty + summary.marketingFund) },
    { label: "Net profit", value: summary.netProfit, isTotal: true },
  ];

  const trendPoints: TrendPoint[] = monthly.map((p) => ({
    label: formatMonthLabel(p.period),
    netSales: p.netSales,
    actualFoodCost: p.actualFoodCost,
    netProfit: p.netProfit,
  }));

  const fixedTotal = heads.reduce((s, h) => s + h.amount, 0);
  const perDay = fixedCostPerDay(fixedTotal, DAYS_IN_AUG);
  const byDate = [...new Set(daily.map((d) => d.date))].sort();
  const grossMarginByDay = byDate.map((date) => {
    const daySales = daily
      .filter((d) => d.date === date)
      .reduce((s, d) => s + d.netSales, 0);
    const foodPct =
      summary.netSales === 0 ? 0 : summary.actualFoodCost / summary.netSales;
    return daySales * (1 - foodPct);
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Actual vs SOP food cost %"
          value={`${summary.actualFoodCostPct.toFixed(1)}%`}
          foot={`SOP target ${summary.sopFoodCostPct.toFixed(1)}%`}
        />
        <KpiCard
          label="Fixed costs"
          value={formatInr(summary.fixedCosts, { compact: true })}
          foot={`${formatInr(perDay)}/day`}
        />
        <KpiCard
          label="Aggregator commission"
          value={formatInr(summary.commission, { compact: true })}
        />
        <KpiCard
          label="Royalty + marketing fund"
          value={formatInr(summary.royalty + summary.marketingFund, { compact: true })}
        />
      </div>

      <ChartFrame
        title="Sales → profit waterfall"
        subtitle="Where every rupee of net sales goes, this month."
        accessibleTable={
          <table className="w-full text-left text-xs">
            <thead>
              <tr>
                <th>Step</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {waterfallSteps.map((s) => (
                <tr key={s.label}>
                  <td>{s.label}</td>
                  <td>{formatInr(s.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      >
        <WaterfallChart steps={waterfallSteps} />
      </ChartFrame>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartFrame
          title="Monthly profit & margin"
          subtitle="Net profit by month, trend to date."
          accessibleTable={
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {trendPoints.map((p) => (
                  <tr key={p.label}>
                    <td>{p.label}</td>
                    <td>{formatInr(p.netProfit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <TrendChart points={trendPoints} />
        </ChartFrame>

        <ChartFrame
          title="Daily break-even"
          subtitle="Gross margin vs. daily fixed cost — red on days below the line."
          accessibleTable={
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Gross margin</th>
                </tr>
              </thead>
              <tbody>
                {byDate.map((d, i) => (
                  <tr key={d}>
                    <td>{d}</td>
                    <td>{formatInr(grossMarginByDay[i])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <BreakEvenChart
            labels={byDate.map((d) => d.slice(-2))}
            grossMarginByDay={grossMarginByDay}
            fixedCostPerDay={perDay}
          />
        </ChartFrame>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartFrame
          title="Fixed costs by head"
          subtitle="This month's fixed-cost total, split by head."
          accessibleTable={
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th>Head</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {heads.map((h) => (
                  <tr key={h.head}>
                    <td>{h.head}</td>
                    <td>{formatInr(h.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <DonutChart
            slices={heads.map((h, i) => ({
              name: h.head,
              value: h.amount,
              color: goldRamp[i % goldRamp.length],
            }))}
          />
        </ChartFrame>

        <ChartFrame
          title="Expense structure by branch"
          subtitle="Every branch's P&L as a % of its own sales. Click a bar to drill in."
          accessibleTable={
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Food cost</th>
                  <th>Commission</th>
                  <th>Fixed</th>
                  <th>Royalty+fund</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {structure.map((r) => (
                  <tr key={r.branchCode}>
                    <td>{r.branchName}</td>
                    <td>{r.foodCostPct.toFixed(1)}%</td>
                    <td>{r.commissionPct.toFixed(1)}%</td>
                    <td>{r.fixedCostsPct.toFixed(1)}%</td>
                    <td>{r.royaltyFundPct.toFixed(1)}%</td>
                    <td>{r.profitPct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <StackedBarChart
            isPercent
            categories={structure.map((r) => r.branchName.replace(" Mandi", ""))}
            series={[
              {
                name: "Food cost",
                color: hiyyaColors.loss,
                data: structure.map((r) => r.foodCostPct),
              },
              {
                name: "Commission",
                color: hiyyaColors.bronze,
                data: structure.map((r) => r.commissionPct),
              },
              {
                name: "Fixed costs",
                color: hiyyaColors.deepGold,
                data: structure.map((r) => r.fixedCostsPct),
              },
              {
                name: "Royalty + fund",
                color: hiyyaColors.platinum,
                data: structure.map((r) => r.royaltyFundPct),
              },
              {
                name: "Profit",
                color: hiyyaColors.gain,
                data: structure.map((r) => r.profitPct),
              },
            ]}
            onBarClick={(i) => {
              const row = structure[i];
              if (row) openBranchDrilldown(row.branchCode as BranchCode);
            }}
          />
        </ChartFrame>
      </div>
    </div>
  );
}
