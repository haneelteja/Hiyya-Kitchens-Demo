"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IngredientVarianceTable } from "@/components/tables/IngredientVarianceTable";
import { useAppStore } from "@/lib/store/useAppStore";
import { useDataSource } from "@/hooks/useDataSource";
import { dataset } from "@/lib/data/mock/dataset";
import { formatInr } from "@/lib/calc/format";
import type { IngredientVarianceRow } from "@/lib/data/DataSource";
import type { PnlResult } from "@/lib/calc/pnl";

const PERIOD = "2026-08";

/**
 * The one shared drill-down dialog (Section 8): a branch quick view (KPIs +
 * ingredient variance) from any rank chart / donut / league table, or an
 * ingredient "likely source" view (which menu items use it) from the heatmap or
 * variance table. A real Radix Dialog — focus-trapped and Escape-to-close for
 * free, not a hand-rolled overlay.
 */
export function DrilldownDialog() {
  const drilldown = useAppStore((s) => s.drilldown);
  const closeDrilldown = useAppStore((s) => s.closeDrilldown);
  const ds = useDataSource();

  const [pnl, setPnl] = useState<PnlResult | null>(null);
  const [variance, setVariance] = useState<IngredientVarianceRow[]>([]);

  useEffect(() => {
    if (!drilldown || drilldown.type !== "branch") return;
    let cancelled = false;
    Promise.all([
      ds.getPnlByBranch({ kind: "branch", branchCode: drilldown.branchCode }, PERIOD),
      ds.getIngredientVariance(
        { kind: "branch", branchCode: drilldown.branchCode },
        PERIOD,
      ),
    ]).then(([byBranch, rows]) => {
      if (cancelled) return;
      setPnl(byBranch[drilldown.branchCode]);
      setVariance(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [drilldown, ds]);

  const open = drilldown !== null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeDrilldown()}>
      <DialogContent className="max-w-2xl border-hiyya-gold/50 bg-hiyya-panel-2 text-hiyya-text">
        {drilldown?.type === "branch" && (
          <BranchDrilldownBody
            branchCode={drilldown.branchCode}
            pnl={pnl}
            variance={variance}
          />
        )}
        {drilldown?.type === "ingredient" && (
          <IngredientDrilldownBody drilldown={drilldown} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function BranchDrilldownBody({
  branchCode,
  pnl,
  variance,
}: {
  branchCode: string;
  pnl: PnlResult | null;
  variance: IngredientVarianceRow[];
}) {
  const branch = dataset.branches.find((b) => b.code === branchCode);
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading text-xl text-hiyya-gold-ink">
          {branch?.name ?? branchCode} — quick view
        </DialogTitle>
      </DialogHeader>
      {pnl && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          <MiniKpi label="Net sales" value={formatInr(pnl.netSales, { compact: true })} />
          <MiniKpi
            label="Net profit"
            value={formatInr(pnl.netProfit, { compact: true })}
          />
          <MiniKpi label="Margin" value={`${pnl.marginPct.toFixed(1)}%`} />
        </div>
      )}
      <div className="max-h-80 overflow-auto">
        <IngredientVarianceTable
          rows={variance}
          showBranch={false}
          onRowClick={() => undefined}
        />
      </div>
    </>
  );
}

function IngredientDrilldownBody({
  drilldown,
}: {
  drilldown: { ingredientKey: string; ingredientName: string; branchCodes: string[] };
}) {
  const items = dataset.menuItems.filter((item) =>
    item.linkedIngredients.includes(drilldown.ingredientKey as never),
  );
  const branchNames = drilldown.branchCodes
    .map((c) => dataset.branches.find((b) => b.code === c)?.name ?? c)
    .join(", ");
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading text-xl text-hiyya-gold-ink">
          {drilldown.ingredientName} — likely source
        </DialogTitle>
      </DialogHeader>
      <p className="mb-3 text-xs text-hiyya-muted">
        Branches in view: {branchNames}. Menu items that use {drilldown.ingredientName} in
        their SOP recipe — check these first for over-portioning.
      </p>
      <Table>
        <TableHeader>
          <TableRow className="border-hiyya-panel-2 hover:bg-transparent">
            <TableHead className="text-hiyya-muted">Menu item</TableHead>
            <TableHead className="text-hiyya-muted">Category</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-hiyya-muted">
                No linked items in the seed data.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.code} className="border-hiyya-panel-2">
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </>
  );
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hiyya-panel-2 bg-[var(--hiyya-well-strong)] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-hiyya-muted">
        {label}
      </p>
      <p className="mt-1 font-heading text-lg font-bold text-hiyya-champagne-ink">{value}</p>
    </div>
  );
}
