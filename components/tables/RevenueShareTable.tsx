"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInr } from "@/lib/calc/format";
import type { RevenueShareRow } from "@/lib/data/DataSource";

/** Net sales, share %, royalty %/₹, fund %/₹, total to brand, branch profit
 * (Section 8), with a placeholder-terms note since Q06 is open. */
export function RevenueShareTable({ rows }: { rows: RevenueShareRow[] }) {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow className="border-hiyya-panel-2 hover:bg-transparent">
            <TableHead className="text-hiyya-muted">Branch</TableHead>
            <TableHead className="text-right text-hiyya-muted">Net sales</TableHead>
            <TableHead className="text-right text-hiyya-muted">Share %</TableHead>
            <TableHead className="text-right text-hiyya-muted">Royalty</TableHead>
            <TableHead className="text-right text-hiyya-muted">Marketing fund</TableHead>
            <TableHead className="text-right text-hiyya-muted">Total to brand</TableHead>
            <TableHead className="text-right text-hiyya-muted">Branch profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.branchCode} className="border-hiyya-panel-2">
              <TableCell>{r.branchName}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatInr(r.netSales, { compact: true })}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {r.sharePct.toFixed(1)}%
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {r.royaltyPct > 0
                  ? `${formatInr(r.royalty, { compact: true })} (${r.royaltyPct.toFixed(0)}%)`
                  : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {r.marketingFundPct > 0
                  ? `${formatInr(r.marketingFund, { compact: true })} (${r.marketingFundPct.toFixed(0)}%)`
                  : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatInr(r.totalToBrand, { compact: true })}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatInr(r.branchProfit, { compact: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="mt-3 text-[11px] text-hiyya-muted">
        Royalty and marketing-fund terms shown are placeholders pending the client&apos;s
        confirmation of what &ldquo;revenue sharing between branches&rdquo; means
        (docs/QUERY_TRACKER.md Q06) — the brand-owned flagship pays neither.
      </p>
    </div>
  );
}
