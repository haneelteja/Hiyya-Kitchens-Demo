"use client";

import { useEffect, useState } from "react";
import { useDataSource } from "@/hooks/useDataSource";
import { useAccessibleScope } from "@/hooks/useAccessibleScope";
import { useAppStore } from "@/lib/store/useAppStore";
import { PurchaseForm } from "@/components/forms/PurchaseForm";
import { TabSkeleton } from "@/components/kpi/TabSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInr, formatIstDate } from "@/lib/calc/format";
import { dataset } from "@/lib/data/mock/dataset";
import type { Purchase, BranchCode } from "@/lib/data/types";

const PERIOD = "2026-08";

function ingredientName(key: string): string {
  return dataset.ingredients.find((i) => i.key === key)?.name ?? key;
}

export function PurchasesTab() {
  const ds = useDataSource();
  const { scope } = useAccessibleScope();
  const demoPurchases = useAppStore((s) => s.demoEdits.purchases);

  const [branchCode, setBranchCode] = useState<BranchCode | null>(null);
  const [seeded, setSeeded] = useState<Purchase[]>([]);

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
    ds.getPurchases(branchCode, PERIOD).then((p) => !cancelled && setSeeded(p));
    return () => {
      cancelled = true;
    };
  }, [ds, branchCode]);

  if (!branchCode) return <TabSkeleton kpis={0} panels={2} />;

  const logged = demoPurchases.filter(
    (p) => p.branchCode === branchCode && p.date.startsWith(PERIOD),
  );
  const rows = [...seeded, ...logged].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_1.3fr] lg:items-start lg:gap-4">
      <PurchaseForm branchCode={branchCode} />

      <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-3">
        <h2 className="font-heading text-base font-semibold text-hiyya-champagne-ink">
          Purchases this month
        </h2>
        <p className="mb-3 text-xs text-hiyya-muted">
          {rows.length} entr{rows.length === 1 ? "y" : "ies"} — most recent first.
        </p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-hiyya-panel-2 hover:bg-transparent">
                <TableHead className="text-hiyya-muted">Date</TableHead>
                <TableHead className="text-hiyya-muted">Ingredient</TableHead>
                <TableHead className="text-right text-hiyya-muted">Qty</TableHead>
                <TableHead className="text-right text-hiyya-muted">Rate</TableHead>
                <TableHead className="text-hiyya-muted">Supplier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id} className="border-hiyya-panel-2">
                  <TableCell className="whitespace-nowrap text-xs text-hiyya-muted">
                    {formatIstDate(p.date)}
                  </TableCell>
                  <TableCell>{ingredientName(p.ingredientKey)}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.qty}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatInr(p.ratePaid)}
                  </TableCell>
                  <TableCell className="text-hiyya-muted">{p.supplier}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
