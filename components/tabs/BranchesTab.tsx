"use client";

import { useEffect, useState } from "react";
import { useDataSource } from "@/hooks/useDataSource";
import { useAccessibleScope } from "@/hooks/useAccessibleScope";
import { useAppStore } from "@/lib/store/useAppStore";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { RankChart, type RankBar } from "@/components/charts/RankChart";
import { LeagueTable } from "@/components/tables/LeagueTable";
import { formatInr } from "@/lib/calc/format";
import type { BranchCode } from "@/lib/data/types";
import type { LeagueTableRow } from "@/lib/data/DataSource";

const PERIOD = "2026-08";

export function BranchesTab() {
  const ds = useDataSource();
  const { scope } = useAccessibleScope();
  const openBranchDrilldown = useAppStore((s) => s.openBranchDrilldown);

  const [league, setLeague] = useState<LeagueTableRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    ds.getLeagueTable(scope, PERIOD).then((r) => !cancelled && setLeague(r));
    return () => {
      cancelled = true;
    };
  }, [ds, scope]);

  const bars: RankBar[] = league.map((r) => ({
    branchCode: r.branchCode,
    label: r.branchName.replace(" Mandi", ""),
    value: r.netSales,
  }));

  return (
    <div className="flex flex-col gap-6">
      <ChartFrame
        title="Branch ranking"
        subtitle="By net sales, Aug 2026. Click a bar to drill in."
        accessibleTable={
          <table className="w-full text-left text-xs">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Net sales</th>
              </tr>
            </thead>
            <tbody>
              {bars.map((b) => (
                <tr key={b.branchCode}>
                  <td>{b.label}</td>
                  <td>{formatInr(b.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      >
        <RankChart
          bars={bars}
          onBarClick={(code) => openBranchDrilldown(code as BranchCode)}
        />
      </ChartFrame>

      <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-4">
        <h3 className="mb-3 font-heading text-base font-semibold text-hiyya-champagne">
          League table
        </h3>
        <LeagueTable
          rows={league}
          onRowClick={(code) => openBranchDrilldown(code as BranchCode)}
        />
      </div>
    </div>
  );
}
