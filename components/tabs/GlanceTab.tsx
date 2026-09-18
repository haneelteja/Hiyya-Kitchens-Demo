"use client";

import { useEffect, useMemo, useState } from "react";
import { useDataSource } from "@/hooks/useDataSource";
import { useAccessibleScope } from "@/hooks/useAccessibleScope";
import { useAppStore } from "@/lib/store/useAppStore";
import { KpiCard } from "@/components/kpi/KpiCard";
import { LeakCard } from "@/components/kpi/LeakCard";
import { DeltaText } from "@/components/kpi/DeltaText";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { TrendChart, type TrendPoint } from "@/components/charts/TrendChart";
import { formatInr, formatMonthLabel } from "@/lib/calc/format";
import { growthPct, rankBy, anonymizedRankOf } from "@/lib/calc/ranks";
import { trimToFirstTrading } from "@/lib/calc/sales";
import type { BranchRankRow, PnlSeriesPoint } from "@/lib/data/DataSource";
import type { PnlResult } from "@/lib/calc/pnl";
import type { Branch, BranchCode } from "@/lib/data/types";

const PERIOD = "2026-08";
type BenchmarkMetric = "netSales" | "marginPct";
const BENCHMARK_METRICS: {
  id: BenchmarkMetric;
  label: string;
  lowerIsBetter?: boolean;
}[] = [
  { id: "netSales", label: "Net sales" },
  { id: "marginPct", label: "Margin" },
];

/**
 * Branch Owner's "At a glance" (Section 5): full analytics for their own branch(es),
 * a portfolio roll-up when they own more than one, and an *anonymised* rank against
 * the wider network — CLAUDE.md: "Branch Owners never see another branch's
 * identifiable data (ranks only, never names/values)". The benchmark fetch below is
 * the one deliberate exception to the useAccessibleScope-only rule: it reads
 * brand-wide numbers to compute a rank, then only ever renders "rank X of N" for
 * the owner's own branches — the raw brand-wide rows never reach JSX.
 */
export function GlanceTab() {
  const ds = useDataSource();
  const { scope } = useAccessibleScope();
  const openBranchDrilldown = useAppStore((s) => s.openBranchDrilldown);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [portfolioPnl, setPortfolioPnl] = useState<PnlResult | null>(null);
  const [julyPnl, setJulyPnl] = useState<PnlResult | null>(null);
  const [deviationTotal, setDeviationTotal] = useState(0);
  const [series, setSeries] = useState<PnlSeriesPoint[]>([]);
  const [perBranchPnl, setPerBranchPnl] = useState<Record<BranchCode, PnlResult>>(
    {} as Record<BranchCode, PnlResult>,
  );
  const [attention, setAttention] = useState<string[]>([]);
  const [benchmarks, setBenchmarks] = useState<
    Record<BenchmarkMetric, { branchCode: BranchCode; rank: number; of: number }[]>
  >(
    {} as Record<BenchmarkMetric, { branchCode: BranchCode; rank: number; of: number }[]>,
  );

  useEffect(() => {
    let cancelled = false;
    ds.getBranches(scope).then((b) => !cancelled && setBranches(b));
    return () => {
      cancelled = true;
    };
  }, [ds, scope]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      ds.getPnlSummary(scope, PERIOD),
      ds.getPnlSummary(scope, "2026-07").catch(() => null),
      ds.getIngredientVariance(scope, PERIOD),
      ds.getPnlByBranch(scope, PERIOD),
    ]).then(([summary, july, variance, byBranch]) => {
      if (cancelled) return;
      setPortfolioPnl(summary);
      setJulyPnl(july);
      setDeviationTotal(
        variance.reduce((sum, r) => sum + Math.max(0, r.unexplainedValue), 0),
      );
      setPerBranchPnl(byBranch);
    });
    return () => {
      cancelled = true;
    };
  }, [ds, scope]);

  useEffect(() => {
    let cancelled = false;
    ds.getPnlSeries(scope, "daily", PERIOD).then((s) => {
      if (!cancelled) setSeries(trimToFirstTrading(s));
    });
    return () => {
      cancelled = true;
    };
  }, [ds, scope]);

  useEffect(() => {
    let cancelled = false;
    async function loadAttention() {
      const own = await ds.getBranches(scope);
      const lines: string[] = [];
      for (const b of own) {
        const variance = await ds.getIngredientVariance(
          { kind: "branch", branchCode: b.code },
          PERIOD,
        );
        for (const r of variance.filter((r) => r.flag === "investigate")) {
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
    if (branches.length === 0) return;
    let cancelled = false;
    Promise.all(
      BENCHMARK_METRICS.map(async ({ id, lowerIsBetter }) => {
        const rows: BranchRankRow[] = await ds.getRank({ kind: "all" }, id, PERIOD);
        const ranked = rankBy(rows, (r) => r.value, { lowerIsBetter });
        const ownRanks = branches.map((b) => {
          const found = anonymizedRankOf(ranked, (r) => r.branchCode === b.code);
          return {
            branchCode: b.code as BranchCode,
            rank: found?.rank ?? 0,
            of: found?.of ?? 0,
          };
        });
        return [id, ownRanks] as const;
      }),
    ).then((pairs) => {
      if (!cancelled) setBenchmarks(Object.fromEntries(pairs) as typeof benchmarks);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ds, branches]);

  const growth =
    portfolioPnl && julyPnl ? growthPct(portfolioPnl.netSales, julyPnl.netSales) : null;

  const trendPoints: TrendPoint[] = useMemo(
    () =>
      series.map((p) => ({
        label: p.period.slice(-2),
        netSales: p.netSales,
        actualFoodCost: p.actualFoodCost,
        netProfit: p.netProfit,
      })),
    [series],
  );

  if (!portfolioPnl) return null;
  const isMultiBranch = branches.length > 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Net sales"
          value={formatInr(portfolioPnl.netSales, { compact: true })}
          delta={growth !== null ? <DeltaText value={growth} suffix="vs July" /> : null}
        />
        <KpiCard
          label="Net profit"
          value={formatInr(portfolioPnl.netProfit, { compact: true })}
        />
        <KpiCard label="Margin" value={`${portfolioPnl.marginPct.toFixed(1)}%`} />
        <LeakCard
          label="Lost to SOP deviation"
          value={formatInr(deviationTotal, { compact: true })}
          foot="Unexplained usage vs recipe, Aug 2026"
        />
      </div>

      <ChartFrame
        title={isMultiBranch ? "Portfolio sales & profit trend" : "Sales & profit trend"}
        subtitle="Daily, trimmed to the first trading period."
        accessibleTable={
          <table className="w-full text-left text-xs">
            <thead>
              <tr>
                <th>Day</th>
                <th>Sales</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {trendPoints.map((p, i) => (
                <tr key={i}>
                  <td>{p.label}</td>
                  <td>{formatInr(p.netSales)}</td>
                  <td>{formatInr(p.netProfit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      >
        <TrendChart points={trendPoints} />
      </ChartFrame>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-4">
          <h2 className="font-heading text-base font-semibold text-hiyya-champagne">
            Needs your attention
          </h2>
          <p className="mb-3 text-xs text-hiyya-muted">
            Plain-language flags, worst first.
          </p>
          <ul className="flex flex-col gap-2">
            {attention.length === 0 && (
              <li className="text-sm text-hiyya-muted">Nothing needs attention today.</li>
            )}
            {attention.map((line, i) => (
              <li
                key={i}
                className="rounded-lg border border-hiyya-loss/30 border-l-4 bg-black/20 p-2.5 text-sm"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-4">
          <h2 className="font-heading text-base font-semibold text-hiyya-champagne">
            How you rank vs. the network
          </h2>
          <p className="mb-3 text-xs text-hiyya-muted">
            Rank only — other franchisees&apos; names and figures stay private.
          </p>
          <div className="flex flex-col gap-3">
            {branches.map((b) => (
              <div key={b.code} className="rounded-lg border border-hiyya-panel-2 p-3">
                <p className="mb-1.5 text-sm font-semibold text-hiyya-champagne">
                  {b.name}
                </p>
                <div className="flex gap-4 text-xs">
                  {BENCHMARK_METRICS.map((m) => {
                    const r = benchmarks[m.id]?.find((x) => x.branchCode === b.code);
                    return (
                      <div key={m.id}>
                        <span className="text-hiyya-muted">{m.label}: </span>
                        <span className="font-bold text-hiyya-gold">
                          {r && r.of > 0 ? `Rank ${r.rank} of ${r.of}` : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isMultiBranch && (
        <div>
          <h2 className="mb-3 px-1 font-heading text-lg font-semibold text-hiyya-champagne">
            Your branches
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {branches.map((b) => {
              const pnl = perBranchPnl[b.code as BranchCode];
              if (!pnl) return null;
              return (
                <button
                  key={b.code}
                  onClick={() => openBranchDrilldown(b.code as BranchCode)}
                  className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-4 text-left transition-colors hover:border-hiyya-gold/50"
                >
                  <h3 className="font-heading text-lg font-semibold">{b.name}</h3>
                  <dl className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between border-t border-dashed border-hiyya-panel-2 pt-1">
                      <dt className="text-hiyya-muted">Net sales</dt>
                      <dd>{formatInr(pnl.netSales, { compact: true })}</dd>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-hiyya-panel-2 pt-1">
                      <dt className="text-hiyya-muted">Margin</dt>
                      <dd>{pnl.marginPct.toFixed(1)}%</dd>
                    </div>
                  </dl>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <p className="text-center text-[11px] text-hiyya-muted">
        Month: {formatMonthLabel(PERIOD)} 2026
      </p>
    </div>
  );
}
