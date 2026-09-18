"use client";

import { useEffect, useState } from "react";
import { useDataSource } from "@/hooks/useDataSource";
import { useAccessibleScope } from "@/hooks/useAccessibleScope";
import { useAppStore } from "@/lib/store/useAppStore";
import { WastageForm } from "@/components/forms/WastageForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatIstDate } from "@/lib/calc/format";
import { dataset } from "@/lib/data/mock/dataset";
import type { WastageEntry, BranchCode } from "@/lib/data/types";

const PERIOD = "2026-08";

function ingredientName(key: string): string {
  return dataset.ingredients.find((i) => i.key === key)?.name ?? key;
}

export function WastageTab() {
  const ds = useDataSource();
  const { scope } = useAccessibleScope();
  const demoWastage = useAppStore((s) => s.demoEdits.wastageEntries);

  const [branchCode, setBranchCode] = useState<BranchCode | null>(null);
  const [seeded, setSeeded] = useState<WastageEntry[]>([]);

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
    ds.getWastageEntries(branchCode, PERIOD).then((w) => !cancelled && setSeeded(w));
    return () => {
      cancelled = true;
    };
  }, [ds, branchCode]);

  if (!branchCode) return null;

  const logged = demoWastage.filter(
    (w) => w.branchCode === branchCode && w.date.startsWith(PERIOD),
  );
  const rows = [...seeded, ...logged].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_1.3fr] lg:items-start lg:gap-4">
      <WastageForm branchCode={branchCode} />

      <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-4">
        <h3 className="font-heading text-base font-semibold text-hiyya-champagne">
          Wastage this month
        </h3>
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
                <TableHead className="text-hiyya-muted">Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((w) => (
                <TableRow key={w.id} className="border-hiyya-panel-2">
                  <TableCell className="whitespace-nowrap text-xs text-hiyya-muted">
                    {formatIstDate(w.date)}
                  </TableCell>
                  <TableCell>{ingredientName(w.ingredientKey)}</TableCell>
                  <TableCell className="text-right tabular-nums">{w.qty}</TableCell>
                  <TableCell className="text-hiyya-muted">{w.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
