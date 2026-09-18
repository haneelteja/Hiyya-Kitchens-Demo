"use client";

import { useMemo, useState } from "react";
import { useAppStore, fixedCostOverrideKey } from "@/lib/store/useAppStore";
import { applyOverridesToFixedCosts, sumFixedCosts } from "@/lib/calc/fixedCosts";
import { formatInr } from "@/lib/calc/format";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FixedCostHead, type BranchCode, type FixedCost } from "@/lib/data/types";

interface Props {
  branchCode: BranchCode;
  month: string;
  baseCosts: FixedCost[];
  /** Fires with the new monthly total every time an edit changes it, so the
   * parent can recompute net profit/margin live without re-fetching. */
  onTotalChange?: (newTotal: number) => void;
}

/**
 * Every head is live — no Apply button. Unlike the SOP recipe editor (Phase 4),
 * a fixed cost is a pure additive input to computePnl with no reconciliation
 * ambiguity, so there's nothing to "preview" separately from the real number:
 * typing a new Rent figure changes this branch's profit the instant you type it,
 * exactly per docs/PLAN.md's "editable fixed-cost grid with live recalculation".
 * Edits still only ever touch demoEdits.fixedCostOverrides (in-memory, Section 4).
 */
export function FixedCostGrid({ branchCode, month, baseCosts, onTotalChange }: Props) {
  const overrides = useAppStore((s) => s.demoEdits.fixedCostOverrides);
  const setOverride = useAppStore((s) => s.setFixedCostOverride);
  const clearOverride = useAppStore((s) => s.clearFixedCostOverride);
  const [drafts, setDrafts] = useState<Partial<Record<string, string>>>({});

  const rows = useMemo(
    () =>
      FixedCostHead.options
        .map((head) => baseCosts.find((c) => c.head === head))
        .filter((c): c is FixedCost => c !== undefined),
    [baseCosts],
  );

  function isOverridden(head: string) {
    return Object.prototype.hasOwnProperty.call(
      overrides,
      fixedCostOverrideKey(
        branchCode,
        month,
        head as (typeof FixedCostHead.options)[number],
      ),
    );
  }

  function effectiveAmount(row: FixedCost): number {
    const key = fixedCostOverrideKey(branchCode, month, row.head);
    return overrides[key] ?? row.amount;
  }

  function commit(row: FixedCost, value: number) {
    setOverride(branchCode, month, row.head, value);
    const overridesByHead = Object.fromEntries(
      rows.map((r) => [r.head, r.head === row.head ? value : effectiveAmount(r)]),
    );
    const newTotal = sumFixedCosts(
      applyOverridesToFixedCosts(baseCosts, overridesByHead),
      branchCode,
      month,
    );
    onTotalChange?.(newTotal);
  }

  function handleChange(row: FixedCost, text: string) {
    setDrafts((d) => ({ ...d, [row.head]: text }));
    const n = Number(text);
    if (text.trim() !== "" && Number.isFinite(n) && n >= 0) {
      commit(row, n);
    }
  }

  function revert(row: FixedCost) {
    clearOverride(branchCode, month, row.head);
    setDrafts((d) => {
      const next = { ...d };
      delete next[row.head];
      return next;
    });
    const overridesByHead = Object.fromEntries(
      rows.filter((r) => r.head !== row.head).map((r) => [r.head, effectiveAmount(r)]),
    );
    const newTotal = sumFixedCosts(
      applyOverridesToFixedCosts(baseCosts, overridesByHead),
      branchCode,
      month,
    );
    onTotalChange?.(newTotal);
  }

  const total = rows.reduce((s, r) => s + effectiveAmount(r), 0);
  const baseTotal = sumFixedCosts(baseCosts, branchCode, month);

  return (
    <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-4">
      <h2 className="font-heading text-base font-semibold text-hiyya-champagne">
        Fixed costs — {month}
      </h2>
      <p className="mb-3 text-xs text-hiyya-muted">
        Edit any head to see net profit and margin recalculate immediately below.
      </p>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs text-hiyya-muted">
            <th className="pb-1 font-normal">Head</th>
            <th className="pb-1 font-normal">Amount (₹)</th>
            <th className="pb-1 font-normal" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const overridden = isOverridden(row.head);
            const value = drafts[row.head] ?? String(effectiveAmount(row));
            return (
              <tr key={row.head} className="border-t border-hiyya-panel-2/60">
                <td className="py-1.5">{row.head}</td>
                <td className="py-1.5">
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    value={value}
                    onChange={(e) => handleChange(row, e.target.value)}
                    className={cn(
                      "h-8 max-w-[9rem] text-sm",
                      overridden && "border-hiyya-gold text-hiyya-gold",
                    )}
                  />
                </td>
                <td className="py-1.5 text-right">
                  {overridden && (
                    <button
                      onClick={() => revert(row)}
                      className="text-[11px] text-hiyya-muted hover:text-hiyya-champagne"
                    >
                      Revert
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-hiyya-panel-2 font-bold">
            <td className="py-2">Total</td>
            <td className="py-2" colSpan={2}>
              {formatInr(total)}
              {total !== baseTotal && (
                <span
                  className={cn(
                    "ml-2 text-xs font-normal",
                    total > baseTotal ? "text-hiyya-loss" : "text-hiyya-gain",
                  )}
                >
                  ({total > baseTotal ? "+" : ""}
                  {formatInr(total - baseTotal)} vs original)
                </span>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
