"use client";

import { memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sparkline } from "@/components/tables/Sparkline";
import { HealthPill } from "@/components/tables/StatusPill";
import { formatInr } from "@/lib/calc/format";
import { branchColors } from "@/lib/theme/tokens";
import type { LeagueTableRow } from "@/lib/data/DataSource";

/**
 * Memoized so a row only re-renders when its own data changes — not on every
 * LeagueTable render caused by unrelated state elsewhere on the tab. Only
 * effective because `onRowClick` is a stable reference from the caller (see
 * BranchesTab's `handleRowClick`, wrapped in `useCallback`); an inline arrow
 * function passed as `onRowClick` would defeat this by changing identity
 * every render (perf review, Section 2, P1).
 */
const LeagueRow = memo(function LeagueRow({
  row,
  onRowClick,
}: {
  row: LeagueTableRow;
  onRowClick: (branchCode: string) => void;
}) {
  return (
    <TableRow
      role="button"
      tabIndex={0}
      onClick={() => onRowClick(row.branchCode)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onRowClick(row.branchCode);
        }
      }}
      className="cursor-pointer border-hiyya-panel-2 hover:bg-white/[0.03] focus-visible:bg-white/[0.06] focus-visible:outline-none"
    >
      <TableCell className="font-heading text-lg text-hiyya-champagne">
        {row.rank}
      </TableCell>
      <TableCell>{row.branchName}</TableCell>
      <TableCell>
        <Sparkline values={row.monthlySales} color={branchColors[row.branchCode]} />
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatInr(row.netSales, { compact: true })}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {row.marginPct.toFixed(1)}%
      </TableCell>
      <TableCell>
        <HealthPill status={row.health} />
      </TableCell>
    </TableRow>
  );
});

/** Branches tab: rank, monthly sales sparkline, health pill, row drill-down (Section 8). */
export function LeagueTable({
  rows,
  onRowClick,
}: {
  rows: LeagueTableRow[];
  onRowClick: (branchCode: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-hiyya-panel-2 hover:bg-transparent">
          <TableHead className="text-hiyya-muted">Rank</TableHead>
          <TableHead className="text-hiyya-muted">Branch</TableHead>
          <TableHead className="text-hiyya-muted">Monthly sales</TableHead>
          <TableHead className="text-right text-hiyya-muted">Net sales</TableHead>
          <TableHead className="text-right text-hiyya-muted">Margin</TableHead>
          <TableHead className="text-hiyya-muted">Health</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <LeagueRow key={r.branchCode} row={r} onRowClick={onRowClick} />
        ))}
      </TableBody>
    </Table>
  );
}
