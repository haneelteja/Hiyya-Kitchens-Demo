"use client";

import { useEffect, useState } from "react";
import { useDataSource } from "@/hooks/useDataSource";
import { useAccessibleScope } from "@/hooks/useAccessibleScope";
import { KpiCard } from "@/components/kpi/KpiCard";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { DonutChart } from "@/components/charts/DonutChart";
import { RevenueShareTable } from "@/components/tables/RevenueShareTable";
import { formatInr } from "@/lib/calc/format";
import { branchColors } from "@/lib/theme/tokens";
import type { RevenueShareRow } from "@/lib/data/DataSource";

const PERIOD = "2026-08";

export function RevshareTab() {
  const ds = useDataSource();
  const { scope } = useAccessibleScope();
  const [rows, setRows] = useState<RevenueShareRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    ds.getRevenueShareSummary(scope, PERIOD).then((r) => !cancelled && setRows(r));
    return () => {
      cancelled = true;
    };
  }, [ds, scope]);

  const totalToBrand = rows.reduce((s, r) => s + r.totalToBrand, 0);
  const royalty = rows.reduce((s, r) => s + r.royalty, 0);
  const fund = rows.reduce((s, r) => s + r.marketingFund, 0);
  const branchProfit = rows.reduce((s, r) => s + r.branchProfit, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Brand revenue"
          value={formatInr(totalToBrand, { compact: true })}
          foot="Royalty + marketing fund received"
        />
        <KpiCard label="Royalty" value={formatInr(royalty, { compact: true })} />
        <KpiCard label="Marketing fund" value={formatInr(fund, { compact: true })} />
        <KpiCard
          label="Branch-level profit"
          value={formatInr(branchProfit, { compact: true })}
          foot="Sum across branches in view"
        />
      </div>

      <ChartFrame
        title="Revenue share"
        subtitle="Each branch's share of brand-wide net sales."
        accessibleTable={
          <table className="w-full text-left text-xs">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.branchCode}>
                  <td>{r.branchName}</td>
                  <td>{r.sharePct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      >
        <DonutChart
          slices={rows.map((r) => ({
            name: r.branchName.replace(" Mandi", ""),
            value: r.sharePct,
            color: branchColors[r.branchCode],
            key: r.branchCode,
          }))}
          valueIsPercent
        />
      </ChartFrame>

      <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-4">
        <h3 className="mb-3 font-heading text-base font-semibold text-hiyya-champagne">
          Split by branch
        </h3>
        <RevenueShareTable rows={rows} />
      </div>
    </div>
  );
}
