"use client";

import { useCallback, useEffect, useState } from "react";
import { useDataSource } from "@/hooks/useDataSource";
import { useAccessibleScope } from "@/hooks/useAccessibleScope";
import { useAppStore } from "@/lib/store/useAppStore";
import { KpiCard } from "@/components/kpi/KpiCard";
import { LeakCard } from "@/components/kpi/LeakCard";
import { Leaderboard, type LeaderboardRow } from "@/components/kpi/Leaderboard";
import { LeagueTable } from "@/components/tables/LeagueTable";
import { formatInr, shortBranchName } from "@/lib/calc/format";
import { branchColors } from "@/lib/theme/tokens";
import type { BranchCode } from "@/lib/data/types";
import type { LeagueTableRow } from "@/lib/data/DataSource";
import type { PnlResult } from "@/lib/calc/pnl";

const PERIOD = "2026-08";

export function BranchesTab() {
  const ds = useDataSource();
  const { scope } = useAccessibleScope();
  const openBranchDrilldown = useAppStore((s) => s.openBranchDrilldown);

  const [league, setLeague] = useState<LeagueTableRow[]>([]);
  const [summary, setSummary] = useState<PnlResult | null>(null);
  const [deviationTotal, setDeviationTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    ds.getLeagueTable(scope, PERIOD).then((r) => !cancelled && setLeague(r));
    ds.getPnlSummary(scope, PERIOD).then((s) => !cancelled && setSummary(s));
    ds.getIngredientVariance(scope, PERIOD).then((variance) => {
      if (cancelled) return;
      setDeviationTotal(variance.reduce((s, r) => s + Math.max(0, r.unexplainedValue), 0));
    });
    return () => {
      cancelled = true;
    };
  }, [ds, scope]);

  // Stable reference so LeagueTable's memoized rows don't re-render on every
  // BranchesTab render (perf review, Section 2, P1) — openBranchDrilldown
  // itself is a Zustand action, stable for the store's lifetime.
  const handleRowClick = useCallback(
    (code: string) => openBranchDrilldown(code as BranchCode),
    [openBranchDrilldown],
  );

  const leaderboardRows: LeaderboardRow[] = league.map((r) => ({
    code: r.branchCode,
    name: shortBranchName(r.branchName),
    color: branchColors[r.branchCode] ?? "#D4AF37",
    value: r.netSales,
  }));

  const topBranch = league[0];
  const averageMargin =
    league.length === 0 ? 0 : league.reduce((s, r) => s + r.marginPct, 0) / league.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Net sales"
          value={summary ? formatInr(summary.netSales, { compact: true }) : "…"}
          foot={`${league.length} branch${league.length === 1 ? "" : "es"} in view`}
        />
        <KpiCard
          label="Top performer"
          value={topBranch ? shortBranchName(topBranch.branchName) : "…"}
          foot={topBranch ? formatInr(topBranch.netSales, { compact: true }) : undefined}
        />
        <KpiCard
          label="Average margin"
          value={league.length > 0 ? `${averageMargin.toFixed(1)}%` : "…"}
        />
        <LeakCard
          label="Lost to SOP deviation"
          value={formatInr(deviationTotal, { compact: true })}
          foot="Unexplained usage vs recipe, Aug 2026"
        />
      </div>

      <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-3">
        <h2 className="font-heading text-base font-semibold text-hiyya-champagne">
          Branch ranking
        </h2>
        <p className="mb-2 text-xs text-hiyya-muted">
          By net sales, Aug 2026. Click a branch to drill in.
        </p>
        <Leaderboard
          metricKey="netSales"
          rows={leaderboardRows}
          formatValue={(v) => formatInr(v, { compact: true })}
          onRowClick={handleRowClick}
        />
      </div>

      <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-3">
        <h2 className="mb-3 font-heading text-base font-semibold text-hiyya-champagne">
          League table
        </h2>
        <LeagueTable rows={league} onRowClick={handleRowClick} />
      </div>
    </div>
  );
}
