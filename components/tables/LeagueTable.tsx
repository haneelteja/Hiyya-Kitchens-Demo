"use client";

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
          <TableRow
            key={r.branchCode}
            role="button"
            tabIndex={0}
            onClick={() => onRowClick(r.branchCode)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRowClick(r.branchCode);
              }
            }}
            className="cursor-pointer border-hiyya-panel-2 hover:bg-white/[0.03] focus-visible:bg-white/[0.06] focus-visible:outline-none"
          >
            <TableCell className="font-heading text-lg text-hiyya-champagne">
              {r.rank}
            </TableCell>
            <TableCell>{r.branchName}</TableCell>
            <TableCell>
              <Sparkline values={r.monthlySales} color={branchColors[r.branchCode]} />
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatInr(r.netSales, { compact: true })}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {r.marginPct.toFixed(1)}%
            </TableCell>
            <TableCell>
              <HealthPill status={r.health} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
