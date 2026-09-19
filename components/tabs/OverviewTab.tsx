"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useDataSource } from "@/hooks/useDataSource";
import { useAccessibleScope } from "@/hooks/useAccessibleScope";
import { useAppStore } from "@/lib/store/useAppStore";
import { KpiCard } from "@/components/kpi/KpiCard";
import { LeakCard } from "@/components/kpi/LeakCard";
import { EmptyState } from "@/components/kpi/EmptyState";
import { ChartFrame } from "@/components/charts/ChartFrame";
import {
  TrendChart,
  type TrendPoint,
  type BranchTrendSeries,
} from "@/components/charts/TrendChart";
import { Leaderboard, type LeaderboardRow } from "@/components/kpi/Leaderboard";
import { DonutChart } from "@/components/charts/DonutChart";
import { formatInr, formatMonthLabel, formatPct } from "@/lib/calc/format";
import { growthPct } from "@/lib/calc/ranks";
import { trimToFirstTrading } from "@/lib/calc/sales";
import { branchColors } from "@/lib/theme/tokens";
import type { BranchRankRow, PnlSeriesPoint } from "@/lib/data/DataSource";
import type { PnlResult } from "@/lib/calc/pnl";
import type { BranchCode } from "@/lib/data/types";
import { dataset } from "@/lib/data/mock/dataset";

const PERIOD = "2026-08";
const RANK_METRICS = [
  { id: "netSales", label: "Net sales" },
  { id: "netProfit", label: "Net profit" },
  { id: "marginPct", label: "Margin" },
  { id: "sopDeviationPct", label: "SOP deviation %" },
] as const;

export function OverviewTab() {
  const ds = useDataSource();
  const { persona, scope } = useAccessibleScope();
  const openBranchDrilldown = useAppStore((s) => s.openBranchDrilldown);

  const [summary, setSummary] = useState<PnlResult | null>(null);
  const [julySummary, setJulySummary] = useState<PnlResult | null>(null);
  const [deviationTotal, setDeviationTotal] = useState(0);
  const [grain, setGrain] = useState<"daily" | "weekly" | "monthly">("daily");
  const [series, setSeries] = useState<PnlSeriesPoint[]>([]);
  const [trendView, setTrendView] = useState<"combined" | "branch">("combined");
  const [branchSeries, setBranchSeries] = useState<BranchTrendSeries[]>([]);
  const [rankMetric, setRankMetric] =
    useState<(typeof RANK_METRICS)[number]["id"]>("netSales");
  const [ranks, setRanks] = useState<BranchRankRow[]>([]);
  const [attention, setAttention] = useState<string[]>([]);
  const [themeRows, setThemeRows] = useState<
    Array<{
      code: BranchCode;
      theme: string;
      branchName: string;
      pnl: PnlResult;
      deviation: number;
    }>
  >([]);

  const isAllBranches = scope.kind === "all";

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      ds.getPnlSummary(scope, PERIOD),
      ds.getPnlSummary(scope, "2026-07").catch(() => null),
      ds.getIngredientVariance(scope, PERIOD),
    ]).then(([s, july, variance]) => {
      if (cancelled) return;
      setSummary(s);
      setJulySummary(july);
      setDeviationTotal(
        variance.reduce((sum, r) => sum + Math.max(0, r.unexplainedValue), 0),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [ds, scope]);

  useEffect(() => {
    let cancelled = false;
    ds.getPnlSeries(scope, grain, PERIOD).then((s) => {
      if (!cancelled) setSeries(trimToFirstTrading(s));
    });
    return () => {
      cancelled = true;
    };
  }, [ds, scope, grain]);

  useEffect(() => {
    if (!isAllBranches) {
      setBranchSeries([]);
      return;
    }
    let cancelled = false;
    async function loadBranchSeries() {
      const branches = await ds.getBranches(scope);
      const rows = await Promise.all(
        branches.map(async (b) => {
          const s = await ds.getPnlSeries(
            { kind: "branch", branchCode: b.code },
            grain,
            PERIOD,
          );
          return {
            code: b.code,
            name: b.name.replace(" Mandi", ""),
            color: branchColors[b.code] ?? "#D4AF37",
            points: trimToFirstTrading(s).map((p) => ({
              label: grain === "monthly" ? formatMonthLabel(p.period) : p.period.slice(-2),
              netSales: p.netSales,
              actualFoodCost: p.actualFoodCost,
              netProfit: p.netProfit,
            })),
          };
        }),
      );
      if (!cancelled) setBranchSeries(rows);
    }
    loadBranchSeries();
    return () => {
      cancelled = true;
    };
  }, [ds, scope, grain, isAllBranches]);

  useEffect(() => {
    let cancelled = false;
    ds.getRank(scope, rankMetric, PERIOD).then((r) => {
      if (!cancelled) setRanks(r);
    });
    return () => {
      cancelled = true;
    };
  }, [ds, scope, rankMetric]);

  useEffect(() => {
    let cancelled = false;
    async function loadAttention() {
      const branches = await ds.getBranches(scope);
      const lines: string[] = [];
      for (const b of branches) {
        const variance = await ds.getIngredientVariance(
          { kind: "branch", branchCode: b.code },
          PERIOD,
        );
        const investigate = variance.filter((r) => r.flag === "investigate");
        for (const r of investigate) {
          lines.push(
            `${b.name} used ${r.deviationPct.toFixed(0)}% more ${r.ingredientName.toLowerCase()} than SOP this month — ${formatInr(r.unexplainedValue)} beyond logged wastage.`,
          );
        }
        const pnl = await ds.getPnlSummary(
          { kind: "branch", branchCode: b.code },
          PERIOD,
        );
        if (pnl.netProfit < 0) lines.push(`${b.name} is loss-making this month.`);
        else if (pnl.marginPct < 15) {
          lines.push(
            `${b.name} margin is ${pnl.marginPct.toFixed(1)}%, below the 15% brand target.`,
          );
        }
      }
      if (!cancelled) setAttention(lines.slice(0, 5));
    }
    loadAttention();
    return () => {
      cancelled = true;
    };
  }, [ds, scope]);

  useEffect(() => {
    if (!isAllBranches) return;
    let cancelled = false;
    async function loadThemes() {
      const rows = await Promise.all(
        dataset.themes.map(async (t) => {
          const branch = dataset.branches.find((b) => b.code === t.branchCode)!;
          const pnl = await ds.getPnlSummary(
            { kind: "branch", branchCode: t.branchCode },
            PERIOD,
          );
          const variance = await ds.getIngredientVariance(
            { kind: "branch", branchCode: t.branchCode },
            PERIOD,
          );
          const deviation = variance.reduce(
            (s, r) => s + Math.max(0, r.unexplainedValue),
            0,
          );
          return {
            code: t.branchCode,
            theme: t.name,
            branchName: branch.name,
            pnl,
            deviation,
          };
        }),
      );
      if (!cancelled) setThemeRows(rows);
    }
    loadThemes();
    return () => {
      cancelled = true;
    };
  }, [ds, isAllBranches]);

  const growth =
    summary && julySummary ? growthPct(summary.netSales, julySummary.netSales) : null;

  const trendPoints: TrendPoint[] = useMemo(
    () =>
      series.map((p) => ({
        label: grain === "monthly" ? formatMonthLabel(p.period) : p.period.slice(-2),
        netSales: p.netSales,
        actualFoodCost: p.actualFoodCost,
        netProfit: p.netProfit,
      })),
    [series, grain],
  );

  const leaderboardRows: LeaderboardRow[] = ranks.map((r) => ({
    code: r.branchCode,
    name: r.branchName.replace(" Mandi", ""),
    color: branchColors[r.branchCode] ?? "#D4AF37",
    value: r.value,
  }));
  const isRankPercent = rankMetric === "marginPct" || rankMetric === "sopDeviationPct";
  const formatRankValue = (v: number) =>
    isRankPercent ? `${v.toFixed(1)}%` : formatInr(v, { compact: true });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Net sales"
          value={summary ? formatInr(summary.netSales, { compact: true }) : "…"}
        />
        <KpiCard
          label="Growth"
          value={growth !== null ? formatPct(growth) : "…"}
          foot="vs July net sales"
        />
        <KpiCard
          label="Total expenses"
          value={
            summary
              ? formatInr(
                  summary.actualFoodCost +
                    summary.commission +
                    summary.fixedCosts +
                    summary.royalty +
                    summary.marketingFund,
                  { compact: true },
                )
              : "…"
          }
          foot={summary ? `${(100 - summary.marginPct).toFixed(1)}% of sales` : undefined}
        />
        <KpiCard
          label="Net profit · margin"
          value={summary ? formatInr(summary.netProfit, { compact: true }) : "…"}
          foot={summary ? `${summary.marginPct.toFixed(1)}% margin` : undefined}
        />
        <LeakCard
          label="Lost to SOP deviation"
          value={formatInr(deviationTotal, { compact: true })}
          foot="Unexplained usage vs recipe, Aug 2026"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-3">
          <h2 className="font-heading text-base font-semibold text-hiyya-champagne">
            Needs your attention
          </h2>
          <p className="mb-2 text-xs text-hiyya-muted">
            Plain-language flags, worst first.
          </p>
          {attention.length === 0 ? (
            <EmptyState message="Nothing needs attention today." />
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {attention.map((line, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-hiyya-loss/30 border-l-4 bg-black/20 p-2.5 text-sm"
                >
                  {line}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-3">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-heading text-base font-semibold text-hiyya-champagne">
                Branch ranking
              </h2>
              <p className="text-xs text-hiyya-muted">
                Click a branch to open its quick view.
              </p>
            </div>
            <select
              aria-label="Rank by"
              value={rankMetric}
              onChange={(e) => setRankMetric(e.target.value as typeof rankMetric)}
              className="rounded-lg border border-hiyya-panel-2 bg-hiyya-panel-2 px-2 py-1 text-xs"
            >
              {RANK_METRICS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <Leaderboard
            metricKey={rankMetric}
            rows={leaderboardRows}
            formatValue={formatRankValue}
            onRowClick={(code) => openBranchDrilldown(code as BranchCode)}
          />
        </div>
      </div>

      <ChartFrame
        title="Sales, expenses & profit trend"
        subtitle={
          isAllBranches && trendView === "branch"
            ? "Daily, weekly, or monthly — each branch's sales (solid) and expenses (dashed)."
            : isAllBranches
              ? "Daily, weekly, or monthly — hover a point for the branch-by-branch breakdown."
              : "Daily, weekly, or monthly — trimmed to the first trading period."
        }
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            {isAllBranches && (
              <div className="flex overflow-hidden rounded-lg border border-hiyya-panel-2">
                {(["combined", "branch"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setTrendView(v)}
                    aria-pressed={trendView === v}
                    className={`px-3 py-1.5 text-xs font-bold ${trendView === v ? "bg-gradient-to-br from-hiyya-champagne to-hiyya-gold text-black" : "bg-hiyya-panel-2 text-hiyya-muted"}`}
                  >
                    {v === "combined" ? "Combined" : "By branch"}
                  </button>
                ))}
              </div>
            )}
            <div className="flex overflow-hidden rounded-lg border border-hiyya-panel-2">
              {(["daily", "weekly", "monthly"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGrain(g)}
                  aria-pressed={grain === g}
                  className={`px-3 py-1.5 text-xs font-bold capitalize ${grain === g ? "bg-gradient-to-br from-hiyya-champagne to-hiyya-gold text-black" : "bg-hiyya-panel-2 text-hiyya-muted"}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        }
        accessibleTable={
          isAllBranches && trendView === "branch" ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th>Period</th>
                  {branchSeries.map((b) => (
                    <th key={b.code} colSpan={2}>
                      {b.name}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th></th>
                  {branchSeries.map((b) => (
                    <Fragment key={b.code}>
                      <th>Sales</th>
                      <th>Expenses</th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trendPoints.map((p, i) => (
                  <tr key={i}>
                    <td>{p.label}</td>
                    {branchSeries.map((b) => (
                      <Fragment key={b.code}>
                        <td>{formatInr(b.points[i]?.netSales ?? 0)}</td>
                        <td>{formatInr(b.points[i]?.actualFoodCost ?? 0)}</td>
                      </Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Sales</th>
                  <th>Expenses</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {trendPoints.map((p, i) => (
                  <tr key={i}>
                    <td>{p.label}</td>
                    <td>{formatInr(p.netSales)}</td>
                    <td>{formatInr(p.actualFoodCost)}</td>
                    <td>{formatInr(p.netProfit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      >
        <TrendChart
          points={trendPoints}
          branches={isAllBranches ? branchSeries : undefined}
          view={isAllBranches ? trendView : "combined"}
        />
      </ChartFrame>

      {isAllBranches && (
        <>
          <ChartFrame
            title="Revenue contribution"
            subtitle="Share of brand-wide net sales by branch. Click a slice to drill in."
            accessibleTable={
              <table className="w-full text-left text-xs">
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th>Net sales</th>
                  </tr>
                </thead>
                <tbody>
                  {themeRows.map((t) => (
                    <tr key={t.code}>
                      <td>{t.branchName}</td>
                      <td>{formatInr(t.pnl.netSales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          >
            <DonutChart
              slices={themeRows.map((t) => ({
                name: t.branchName.replace(" Mandi", ""),
                value: t.pnl.netSales,
                color: branchColors[t.code],
                key: t.code,
              }))}
              onSliceClick={(key) => openBranchDrilldown(key as BranchCode)}
            />
          </ChartFrame>

          <div>
            <h2 className="mb-3 px-1 font-heading text-lg font-semibold text-hiyya-champagne">
              Performance by theme
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {themeRows.map((t) => (
                <button
                  key={t.code}
                  onClick={() => openBranchDrilldown(t.code)}
                  className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-hiyya-gold/50 hover:shadow-[0_10px_28px_-14px_rgba(212,175,55,0.4)] focus-visible:-translate-y-0.5 focus-visible:border-hiyya-gold/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hiyya-gold"
                >
                  <div
                    className="mb-2 h-1 rounded-full"
                    style={{ backgroundColor: branchColors[t.code] }}
                  />
                  <h3 className="font-heading text-lg font-semibold">{t.theme}</h3>
                  <p className="mb-2 text-[11px] text-hiyya-muted">{t.branchName}</p>
                  <dl className="space-y-1 text-xs">
                    <div className="flex justify-between border-t border-dashed border-hiyya-panel-2 pt-1">
                      <dt className="text-hiyya-muted">Net sales</dt>
                      <dd>{formatInr(t.pnl.netSales, { compact: true })}</dd>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-hiyya-panel-2 pt-1">
                      <dt className="text-hiyya-muted">Margin</dt>
                      <dd>{t.pnl.marginPct.toFixed(1)}%</dd>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-hiyya-panel-2 pt-1">
                      <dt className="text-hiyya-muted">SOP deviation loss</dt>
                      <dd className="text-hiyya-loss">
                        {formatInr(t.deviation, { compact: true })}
                      </dd>
                    </div>
                  </dl>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      {persona.role === "brand_manager" && (
        <p className="text-center text-xs text-hiyya-muted">
          SOP recipe editing lives in the SOP recipes tab.
        </p>
      )}
    </div>
  );
}
