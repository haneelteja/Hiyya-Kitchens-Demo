"use client";

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
          <TableRow
            key={`${r.branchCode}-${r.ingredientKey}-${i}`}
            role="button"
            tabIndex={0}
            onClick={() => onRowClick(r.ingredientKey, r.ingredientName)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRowClick(r.ingredientKey, r.ingredientName);
              }
            }}
            className="cursor-pointer border-hiyya-panel-2 hover:bg-white/[0.03] focus-visible:bg-white/[0.06] focus-visible:outline-none"
          >
            <TableCell>{r.ingredientName}</TableCell>
            {showBranch && (
              <TableCell className="text-hiyya-muted">{r.branchCode}</TableCell>
            )}
            <TableCell className="text-right tabular-nums">
              {r.sopUsageQty.toLocaleString("en-IN")} {r.unit}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {r.actualUsageQty.toLocaleString("en-IN")} {r.unit}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {r.wastageQty.toLocaleString("en-IN")} {r.unit}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {r.unexplainedQty.toLocaleString("en-IN")} {r.unit}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {r.deviationPct.toFixed(1)}%
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatInr(r.unexplainedValue)}
            </TableCell>
            <TableCell>
              <FlagPill flag={r.flag} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
