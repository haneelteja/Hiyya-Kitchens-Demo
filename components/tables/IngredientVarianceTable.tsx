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
import { FlagPill } from "@/components/tables/StatusPill";
import { formatInr } from "@/lib/calc/format";
import type { IngredientVarianceRow } from "@/lib/data/DataSource";

/**
 * Memoized so a row only re-renders when its own data (or the showBranch
 * column toggle) changes. Only effective because `onRowClick` is a stable
 * reference from the caller (see SopTab's `handleVarianceRowClick`, wrapped
 * in `useCallback`) — perf review, Section 2, P1.
 */
const VarianceRow = memo(function VarianceRow({
  row,
  showBranch,
  onRowClick,
}: {
  row: IngredientVarianceRow;
  showBranch: boolean;
  onRowClick: (ingredientKey: string, ingredientName: string) => void;
}) {
  return (
    <TableRow
      role="button"
      tabIndex={0}
      onClick={() => onRowClick(row.ingredientKey, row.ingredientName)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onRowClick(row.ingredientKey, row.ingredientName);
        }
      }}
      className="cursor-pointer border-hiyya-panel-2 hover:bg-white/[0.03] focus-visible:bg-white/[0.06] focus-visible:outline-none"
    >
      <TableCell>{row.ingredientName}</TableCell>
      {showBranch && <TableCell className="text-hiyya-muted">{row.branchCode}</TableCell>}
      <TableCell className="text-right tabular-nums">
        {row.sopUsageQty.toLocaleString("en-IN")} {row.unit}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {row.actualUsageQty.toLocaleString("en-IN")} {row.unit}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {row.wastageQty.toLocaleString("en-IN")} {row.unit}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {row.unexplainedQty.toLocaleString("en-IN")} {row.unit}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {row.deviationPct.toFixed(1)}%
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatInr(row.unexplainedValue)}
      </TableCell>
      <TableCell>
        <FlagPill flag={row.flag} />
      </TableCell>
    </TableRow>
  );
});

/** The full ingredient variance table with flag pills (Section 8). Row click opens
 * the "which dishes use this ingredient" drill-down. */
export function IngredientVarianceTable({
  rows,
  showBranch,
  onRowClick,
}: {
  rows: IngredientVarianceRow[];
  showBranch: boolean;
  onRowClick: (ingredientKey: string, ingredientName: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-hiyya-panel-2 hover:bg-transparent">
          <TableHead className="text-hiyya-muted">Ingredient</TableHead>
          {showBranch && <TableHead className="text-hiyya-muted">Branch</TableHead>}
          <TableHead className="text-right text-hiyya-muted">SOP usage</TableHead>
          <TableHead className="text-right text-hiyya-muted">Actual</TableHead>
          <TableHead className="text-right text-hiyya-muted">Wastage</TableHead>
          <TableHead className="text-right text-hiyya-muted">Unexplained</TableHead>
          <TableHead className="text-right text-hiyya-muted">Deviation %</TableHead>
          <TableHead className="text-right text-hiyya-muted">Value</TableHead>
          <TableHead className="text-hiyya-muted">Flag</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <VarianceRow
            key={`${r.branchCode}-${r.ingredientKey}-${i}`}
            row={r}
            showBranch={showBranch}
            onRowClick={onRowClick}
          />
        ))}
      </TableBody>
    </Table>
  );
}
