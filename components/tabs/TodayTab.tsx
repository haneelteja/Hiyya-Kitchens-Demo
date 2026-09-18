"use client";

import { useEffect, useState } from "react";
import { useDataSource } from "@/hooks/useDataSource";
import { useAccessibleScope } from "@/hooks/useAccessibleScope";
import { useAppStore } from "@/lib/store/useAppStore";
import { KpiCard } from "@/components/kpi/KpiCard";
import { ReorderPill } from "@/components/tables/StatusPill";
import { formatInr } from "@/lib/calc/format";
import { computeReorderStatus } from "@/lib/calc/stock";
import { dataset } from "@/lib/data/mock/dataset";
import type { TodaySnapshot } from "@/lib/data/DataSource";
import type { BranchCode, StockOnHand } from "@/lib/data/types";

const TODAY = "2026-08-31";

function ingredientName(key: string): string {
  return dataset.ingredients.find((i) => i.key === key)?.name ?? key;
}

/**
 * Branch Manager's landing tab (Section 5: "Today at my branch"). No P&L here —
 * canSeePnl() is false for this role — just today's sales vs. target, what needs
 * reordering right now, and what's been logged today from Purchases/Wastage.
 */
export function TodayTab() {
  const ds = useDataSource();
  const { scope } = useAccessibleScope();
  const purchases = useAppStore((s) => s.demoEdits.purchases);
  const wastageEntries = useAppStore((s) => s.demoEdits.wastageEntries);

  const [branchCode, setBranchCode] = useState<BranchCode | null>(null);
  const [snapshot, setSnapshot] = useState<TodaySnapshot | null>(null);
  const [stock, setStock] = useState<StockOnHand[]>([]);

  useEffect(() => {
    let cancelled = false;
    ds.getBranches(scope).then((b) => {
      const code = b[0]?.code as BranchCode | undefined;
      if (!cancelled && code) setBranchCode(code);
    });
    return () => {
      cancelled = true;
    };
  }, [ds, scope]);

  useEffect(() => {
    if (!branchCode) return;
    let cancelled = false;
    Promise.all([ds.getTodaySnapshot(branchCode), ds.getStockOnHand(branchCode)]).then(
      ([s, st]) => {
        if (cancelled) return;
        setSnapshot(s);
        setStock(st);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [ds, branchCode]);

  if (!branchCode || !snapshot) return null;

  const branchName =
    dataset.branches.find((b) => b.code === branchCode)?.name ?? branchCode;
  const pctOfTarget =
    snapshot.target === 0 ? 0 : (snapshot.netSalesToday / snapshot.target) * 100;

  const reorderRows = stock
    .map((s) => ({ ...s, reorder: computeReorderStatus(s.qtyOnHand, s.avgDailyUsage) }))
    .filter((s) => s.reorder.status !== "ok")
    .sort((a, b) => a.reorder.daysOfCover - b.reorder.daysOfCover);

  const loggedToday = [
    ...purchases
      .filter((p) => p.branchCode === branchCode && p.date === TODAY)
      .map((p) => ({
        kind: "purchase" as const,
        id: p.id,
        text: `Purchased ${p.qty} of ${ingredientName(p.ingredientKey)} from ${p.supplier}`,
      })),
    ...wastageEntries
      .filter((w) => w.branchCode === branchCode && w.date === TODAY)
      .map((w) => ({
        kind: "wastage" as const,
        id: w.id,
        text: `Logged ${w.qty} ${ingredientName(w.ingredientKey)} wastage — ${w.reason}`,
      })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-lg font-semibold text-hiyya-champagne">
          {branchName} — today
        </h2>
        <p className="text-xs text-hiyya-muted">Monday, 31 August 2026.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard
          label="Net sales today"
          value={formatInr(snapshot.netSalesToday, { compact: true })}
          foot={`${pctOfTarget.toFixed(0)}% of today's target (${formatInr(snapshot.target, { compact: true })})`}
        />
        <KpiCard
          label="Wastage logged today"
          value={formatInr(snapshot.wastageLoggedToday, { compact: true })}
          foot={
            snapshot.reorderCount > 0
              ? `${snapshot.reorderCount} ingredient(s) need reordering`
              : "Stock levels healthy"
          }
        />
      </div>

      <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-4">
        <h3 className="font-heading text-base font-semibold text-hiyya-champagne">
          Needs reordering
        </h3>
        <p className="mb-3 text-xs text-hiyya-muted">
          Under 2.5 days of cover — worst first.
        </p>
        {reorderRows.length === 0 ? (
          <p className="text-sm text-hiyya-muted">Nothing needs reordering right now.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {reorderRows.map((s) => (
              <li
                key={s.ingredientKey}
                className="flex items-center justify-between rounded-lg border border-hiyya-panel-2 p-2.5 text-sm"
              >
                <span>
                  {ingredientName(s.ingredientKey)}
                  <span className="ml-2 text-xs text-hiyya-muted">
                    {s.reorder.daysOfCover.toFixed(1)} days of cover
                  </span>
                </span>
                <ReorderPill status={s.reorder.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-4">
        <h3 className="font-heading text-base font-semibold text-hiyya-champagne">
          Logged today
        </h3>
        <p className="mb-3 text-xs text-hiyya-muted">
          Purchases and wastage entries you&apos;ve recorded this session.
        </p>
        {loggedToday.length === 0 ? (
          <p className="text-sm text-hiyya-muted">
            Nothing logged yet — use the Purchases or Wastage tab.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {loggedToday.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-hiyya-panel-2 p-2.5 text-sm"
              >
                {entry.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
