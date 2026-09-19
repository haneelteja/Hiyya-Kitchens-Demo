"use client";

import { useEffect, useMemo, useState } from "react";
import { useDataSource } from "@/hooks/useDataSource";
import { useAccessibleScope } from "@/hooks/useAccessibleScope";
import { useAppStore, fixedCostOverrideKey } from "@/lib/store/useAppStore";
import { KpiCard } from "@/components/kpi/KpiCard";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { DonutChart } from "@/components/charts/DonutChart";
import { FixedCostGrid } from "@/components/forms/FixedCostGrid";
import { TabSkeleton } from "@/components/kpi/TabSkeleton";
import { formatInr } from "@/lib/calc/format";
import { goldRamp } from "@/lib/theme/tokens";
import type { Branch, BranchCode, FixedCost } from "@/lib/data/types";
import type { PnlResult } from "@/lib/calc/pnl";

const PERIOD = "2026-08";

/**
 * Branch Owner's expenses tab (Section 5: "Enter fixed costs"). Centres on the
 * editable Fixed Cost Grid — see components/forms/FixedCostGrid.tsx for why its
 * recalculation is genuinely live rather than a separate preview step, unlike
 * the Phase 4 SOP editor.
 */
export function BranchExpensesTab() {
  const ds = useDataSource();
  const { scope } = useAccessibleScope();
  const overrides = useAppStore((s) => s.demoEdits.fixedCostOverrides);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selected, setSelected] = useState<BranchCode | null>(null);
  const [pnl, setPnl] = useState<PnlResult | null>(null);
  const [baseCosts, setBaseCosts] = useState<FixedCost[]>([]);
  const [liveTotal, setLiveTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    ds.getBranches(scope).then((b) => {
      if (cancelled) return;
      setBranches(b);
      setSelected((current) => current ?? (b[0]?.code as BranchCode | undefined) ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [ds, scope]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    Promise.all([
      ds.getPnlByBranch({ kind: "branch", branchCode: selected }, PERIOD),
      ds.getFixedCosts(selected, PERIOD),
    ]).then(([byBranch, costs]) => {
      if (cancelled) return;
      setPnl(byBranch[selected]);
      setBaseCosts(costs);
      setLiveTotal(null);
    });
    return () => {
      cancelled = true;
    };
  }, [ds, selected]);

  const live = useMemo(() => {
    if (!pnl) return null;
    const fixedCosts = liveTotal ?? pnl.fixedCosts;
    const netProfit = pnl.netProfit - (fixedCosts - pnl.fixedCosts);
    const marginPct = pnl.netSales === 0 ? 0 : (netProfit / pnl.netSales) * 100;
    return { fixedCosts, netProfit, marginPct };
  }, [pnl, liveTotal]);

  if (!selected || !pnl || !live) return <TabSkeleton kpis={4} panels={2} />;

  const branch = branches.find((b) => b.code === selected);
  const effectiveCosts = baseCosts.map((c) => {
    const key = fixedCostOverrideKey(selected, PERIOD, c.head);
    return overrides[key] !== undefined ? { ...c, amount: overrides[key] } : c;
  });

  return (
    <div className="flex flex-col gap-4">
      {branches.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {branches.map((b) => (
            <button
              key={b.code}
              onClick={() => setSelected(b.code as BranchCode)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                b.code === selected
                  ? "border-hiyya-gold bg-hiyya-gold/10 text-hiyya-gold"
                  : "border-hiyya-panel-2 text-hiyya-muted hover:text-hiyya-champagne"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Net sales" value={formatInr(pnl.netSales, { compact: true })} />
        <KpiCard
          label="Fixed costs"
          value={formatInr(live.fixedCosts, { compact: true })}
          foot={live.fixedCosts !== pnl.fixedCosts ? "Edited below" : undefined}
        />
        <KpiCard
          label="Net profit"
          value={formatInr(live.netProfit, { compact: true })}
        />
        <KpiCard label="Margin" value={`${live.marginPct.toFixed(1)}%`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <FixedCostGrid
          key={selected}
          branchCode={selected}
          month={PERIOD}
          baseCosts={baseCosts}
          onTotalChange={setLiveTotal}
        />

        <ChartFrame
          title={`${branch?.name ?? selected} — fixed costs by head`}
          subtitle="This month's split, updated as you edit."
          accessibleTable={
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th>Head</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {effectiveCosts.map((c) => (
                  <tr key={c.head}>
                    <td>{c.head}</td>
                    <td>{formatInr(c.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <DonutChart
            slices={effectiveCosts.map((c, i) => ({
              name: c.head,
              value: c.amount,
              color: goldRamp[i % goldRamp.length],
            }))}
          />
        </ChartFrame>
      </div>
    </div>
  );
}
