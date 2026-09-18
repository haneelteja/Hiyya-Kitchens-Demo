"use client";

import { useEffect, useState } from "react";
import { useDataSource } from "@/hooks/useDataSource";
import { useAccessibleScope } from "@/hooks/useAccessibleScope";
import { ReorderPill } from "@/components/tables/StatusPill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { computeReorderStatus } from "@/lib/calc/stock";
import { resolveEffectiveSopLines } from "@/lib/calc/sop";
import { dataset } from "@/lib/data/mock/dataset";
import type { BranchCode, StockOnHand } from "@/lib/data/types";

const TODAY = "2026-08-31";

function ingredientName(key: string): string {
  return dataset.ingredients.find((i) => i.key === key)?.name ?? key;
}
function ingredientUnit(key: string): string {
  return dataset.ingredients.find((i) => i.key === key)?.unit ?? "";
}
function menuItemName(code: string): string {
  return dataset.menuItems.find((m) => m.code === code)?.name ?? code;
}

/**
 * Stock levels (with reorder status) plus a read-only SOP quick reference for
 * this branch — Branch Manager can view recipe quantities to check portioning
 * against, but only the Brand Manager can edit them (Section 5,
 * canEditSopRecipes in lib/access/scope.ts).
 */
export function StockSopTab() {
  const ds = useDataSource();
  const { scope } = useAccessibleScope();
  const [branchCode, setBranchCode] = useState<BranchCode | null>(null);
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
    ds.getStockOnHand(branchCode).then((s) => !cancelled && setStock(s));
    return () => {
      cancelled = true;
    };
  }, [ds, branchCode]);

  if (!branchCode) return null;

  const stockRows = stock
    .map((s) => ({ ...s, reorder: computeReorderStatus(s.qtyOnHand, s.avgDailyUsage) }))
    .sort((a, b) => a.reorder.daysOfCover - b.reorder.daysOfCover);

  const sopLines = resolveEffectiveSopLines(dataset.sopLines, branchCode, TODAY).sort(
    (a, b) => (a.menuItemCode < b.menuItemCode ? -1 : 1),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-4">
        <h2 className="font-heading text-base font-semibold text-hiyya-champagne">
          Stock on hand
        </h2>
        <p className="mb-3 text-xs text-hiyya-muted">
          Days of cover at current average daily usage — worst first.
        </p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-hiyya-panel-2 hover:bg-transparent">
                <TableHead className="text-hiyya-muted">Ingredient</TableHead>
                <TableHead className="text-right text-hiyya-muted">On hand</TableHead>
                <TableHead className="text-right text-hiyya-muted">
                  Avg daily use
                </TableHead>
                <TableHead className="text-right text-hiyya-muted">
                  Days of cover
                </TableHead>
                <TableHead className="text-hiyya-muted">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockRows.map((s) => (
                <TableRow key={s.ingredientKey} className="border-hiyya-panel-2">
                  <TableCell>{ingredientName(s.ingredientKey)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.qtyOnHand.toFixed(1)} {ingredientUnit(s.ingredientKey)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.avgDailyUsage.toFixed(1)} {ingredientUnit(s.ingredientKey)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Number.isFinite(s.reorder.daysOfCover)
                      ? s.reorder.daysOfCover.toFixed(1)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <ReorderPill status={s.reorder.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-4">
        <h2 className="font-heading text-base font-semibold text-hiyya-champagne">
          SOP quick reference
        </h2>
        <p className="mb-3 text-xs text-hiyya-muted">
          Recipe quantity per portion, read-only — recipe changes are made by the Brand
          Manager.
        </p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-hiyya-panel-2 hover:bg-transparent">
                <TableHead className="text-hiyya-muted">Menu item</TableHead>
                <TableHead className="text-hiyya-muted">Ingredient</TableHead>
                <TableHead className="text-right text-hiyya-muted">Qty/portion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sopLines.map((l) => (
                <TableRow
                  key={`${l.menuItemCode}:${l.ingredientKey}`}
                  className="border-hiyya-panel-2"
                >
                  <TableCell>{menuItemName(l.menuItemCode)}</TableCell>
                  <TableCell>{ingredientName(l.ingredientKey)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {l.qtyPerPortion} {ingredientUnit(l.ingredientKey)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
