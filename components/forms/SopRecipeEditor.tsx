"use client";

import { useMemo, useState } from "react";
import { useAppStore, sopOverrideKey } from "@/lib/store/useAppStore";
import { computeRecipeImpact } from "@/lib/calc/health";
import { flagForDeviationPct } from "@/lib/calc/sop";
import { formatInr, formatPct } from "@/lib/calc/format";
import { FlagPill } from "@/components/tables/StatusPill";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MenuItem, SopLine } from "@/lib/data/types";

export interface IngredientTotals {
  sopUsageQty: number;
  actualUsageQty: number;
  wastageQty: number;
}

interface Props {
  menuItems: MenuItem[];
  sopLines: SopLine[];
  /** ingredientKey -> { name, unit, standardRate } */
  ingredientInfo: Record<string, { name: string; unit: string; standardRate: number }>;
  /** ingredientKey -> aggregate usage across the branch(es) this line applies to */
  totalsForIngredient: (ingredientKey: string, appliesTo: string) => IngredientTotals;
  /** menuItemCode -> estimated portions sold across the branch(es) this line applies to */
  portionsForItem: (menuItemCode: string, appliesTo: string) => number;
  /** appliesTo code -> human label, e.g. "All branches" or "Hitex — Chicken Juicy Mandi" */
  appliesToLabel: (appliesTo: string) => string;
}

/**
 * The demo's recipe editor: pick a SOP line, propose a new qty/portion, see the
 * modelled impact before deciding whether to keep it. Applying only writes to
 * demoEdits.sopOverrides (in-memory, Section 4 guardrail) — it does not recompute
 * Aug's already-reconciled ingredient variance elsewhere in the app. See
 * docs/DATA_CONTRACT.md "SOP lines vs. ingredient usage" for why the two are
 * decoupled in this demo.
 */
export function SopRecipeEditor({
  menuItems,
  sopLines,
  ingredientInfo,
  totalsForIngredient,
  portionsForItem,
  appliesToLabel,
}: Props) {
  const sopOverrides = useAppStore((s) => s.demoEdits.sopOverrides);
  const setSopOverride = useAppStore((s) => s.setSopOverride);
  const clearSopOverride = useAppStore((s) => s.clearSopOverride);

  const [selectedItem, setSelectedItem] = useState<string>(menuItems[0]?.code ?? "");
  const linesForItem = useMemo(
    () => sopLines.filter((l) => l.menuItemCode === selectedItem),
    [sopLines, selectedItem],
  );
  const [selectedLineIdx, setSelectedLineIdx] = useState(0);
  const line = linesForItem[selectedLineIdx];

  const overrideKey = line
    ? sopOverrideKey(line.menuItemCode, line.ingredientKey, line.appliesTo)
    : "";
  const hasOverride = Object.prototype.hasOwnProperty.call(sopOverrides, overrideKey);
  const effectiveQty = hasOverride
    ? sopOverrides[overrideKey]
    : (line?.qtyPerPortion ?? 0);

  const [draftQty, setDraftQty] = useState<string>(String(effectiveQty));

  function selectItem(code: string) {
    setSelectedItem(code);
    setSelectedLineIdx(0);
    const firstLine = sopLines.find((l) => l.menuItemCode === code);
    const key = firstLine
      ? sopOverrideKey(
          firstLine.menuItemCode,
          firstLine.ingredientKey,
          firstLine.appliesTo,
        )
      : "";
    const qty = firstLine ? (sopOverrides[key] ?? firstLine.qtyPerPortion) : 0;
    setDraftQty(String(qty));
  }

  function selectLine(idx: number) {
    setSelectedLineIdx(idx);
    const l = linesForItem[idx];
    if (!l) return;
    const key = sopOverrideKey(l.menuItemCode, l.ingredientKey, l.appliesTo);
    setDraftQty(String(sopOverrides[key] ?? l.qtyPerPortion));
  }

  if (!line) {
    return (
      <p className="text-sm text-hiyya-muted">No SOP lines found for this menu item.</p>
    );
  }

  const ingredient = ingredientInfo[line.ingredientKey];
  const newQty = Number(draftQty);
  const validQty = Number.isFinite(newQty) && newQty >= 0;

  const portionsSold = portionsForItem(line.menuItemCode, line.appliesTo);
  const totals = totalsForIngredient(line.ingredientKey, line.appliesTo);
  const impact = computeRecipeImpact({
    currentQtyPerPortion: line.qtyPerPortion,
    newQtyPerPortion: validQty ? newQty : line.qtyPerPortion,
    portionsSold,
    actualUsageQty: totals.actualUsageQty,
    wastageQty: totals.wastageQty,
    currentSopUsageQty: totals.sopUsageQty,
  });
  const currentDeviationPct =
    totals.sopUsageQty === 0
      ? 0
      : ((totals.actualUsageQty - totals.sopUsageQty - totals.wastageQty) /
          totals.sopUsageQty) *
        100;
  const newFlag = flagForDeviationPct(impact.newDeviationPct);
  const currentFlag = flagForDeviationPct(currentDeviationPct);
  const deltaValue = impact.deltaSopUsage * (ingredient?.standardRate ?? 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-4">
        <h3 className="font-heading text-base font-semibold text-hiyya-champagne">
          Recipe
        </h3>
        <p className="mb-3 text-xs text-hiyya-muted">
          Pick a menu item, then a recipe line, to edit its quantity per portion.
        </p>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {menuItems.map((item) => (
            <button
              key={item.code}
              onClick={() => selectItem(item.code)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                item.code === selectedItem
                  ? "border-hiyya-gold bg-hiyya-gold/10 text-hiyya-gold"
                  : "border-hiyya-panel-2 text-hiyya-muted hover:text-hiyya-champagne",
              )}
            >
              {item.name}
            </button>
          ))}
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-hiyya-muted">
              <th className="pb-1 font-normal">Ingredient</th>
              <th className="pb-1 font-normal">Qty/portion</th>
              <th className="pb-1 font-normal">Yield</th>
              <th className="pb-1 font-normal">Applies to</th>
            </tr>
          </thead>
          <tbody>
            {linesForItem.map((l, i) => {
              const key = sopOverrideKey(l.menuItemCode, l.ingredientKey, l.appliesTo);
              const overridden = Object.prototype.hasOwnProperty.call(sopOverrides, key);
              const info = ingredientInfo[l.ingredientKey];
              return (
                <tr
                  key={key}
                  onClick={() => selectLine(i)}
                  className={cn(
                    "cursor-pointer border-t border-hiyya-panel-2/60",
                    i === selectedLineIdx
                      ? "bg-hiyya-gold/10"
                      : "hover:bg-hiyya-panel-2/40",
                  )}
                >
                  <td className="py-1.5">{info?.name ?? l.ingredientKey}</td>
                  <td className="py-1.5">
                    {overridden ? (
                      <span className="text-hiyya-gold">
                        {sopOverrides[key]} {info?.unit}
                      </span>
                    ) : (
                      <>
                        {l.qtyPerPortion} {info?.unit}
                      </>
                    )}
                  </td>
                  <td className="py-1.5">{l.yieldPct}%</td>
                  <td className="py-1.5">{appliesToLabel(l.appliesTo)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-4">
        <h3 className="font-heading text-base font-semibold text-hiyya-champagne">
          Impact preview
        </h3>
        <p className="mb-3 text-xs text-hiyya-muted">
          {ingredient?.name ?? line.ingredientKey} in{" "}
          {menuItems.find((m) => m.code === line.menuItemCode)?.name}, modelled against
          Aug 2026&apos;s actual usage — {appliesToLabel(line.appliesTo)}.
        </p>

        <label className="mb-1 block text-xs font-medium text-hiyya-muted">
          New qty per portion ({ingredient?.unit})
        </label>
        <Input
          type="number"
          min={0}
          step={0.01}
          value={draftQty}
          onChange={(e) => setDraftQty(e.target.value)}
          className="mb-4 max-w-[10rem]"
        />

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-hiyya-panel-2 p-3">
            <p className="text-hiyya-muted">Current deviation</p>
            <p className="mt-1 font-heading text-lg font-bold text-hiyya-champagne">
              {formatPct(currentDeviationPct)}
            </p>
            <div className="mt-1">
              <FlagPill flag={currentFlag} />
            </div>
          </div>
          <div className="rounded-lg border border-hiyya-gold/40 bg-hiyya-gold/5 p-3">
            <p className="text-hiyya-muted">New deviation, if applied</p>
            <p className="mt-1 font-heading text-lg font-bold text-hiyya-champagne">
              {validQty ? formatPct(impact.newDeviationPct) : "—"}
            </p>
            <div className="mt-1">{validQty ? <FlagPill flag={newFlag} /> : null}</div>
          </div>
        </div>

        <dl className="mt-4 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <dt className="text-hiyya-muted">Estimated portions sold (Aug 2026)</dt>
            <dd>{portionsSold.toLocaleString("en-IN")}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-hiyya-muted">Change in SOP usage</dt>
            <dd
              className={
                impact.deltaSopUsage >= 0 ? "text-hiyya-loss" : "text-hiyya-gain"
              }
            >
              {impact.deltaSopUsage >= 0 ? "+" : ""}
              {impact.deltaSopUsage.toFixed(1)} {ingredient?.unit}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-hiyya-muted">Value of that change</dt>
            <dd className={deltaValue >= 0 ? "text-hiyya-loss" : "text-hiyya-gain"}>
              {deltaValue >= 0 ? "+" : "-"}
              {formatInr(Math.abs(deltaValue))}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex gap-2">
          <button
            disabled={!validQty}
            onClick={() =>
              setSopOverride(
                line.menuItemCode,
                line.ingredientKey,
                line.appliesTo,
                newQty,
              )
            }
            className="rounded-full bg-hiyya-gold px-4 py-1.5 text-xs font-bold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Apply to demo
          </button>
          {hasOverride && (
            <button
              onClick={() => {
                clearSopOverride(line.menuItemCode, line.ingredientKey, line.appliesTo);
                setDraftQty(String(line.qtyPerPortion));
              }}
              className="rounded-full border border-hiyya-panel-2 px-4 py-1.5 text-xs text-hiyya-muted hover:text-hiyya-champagne"
            >
              Revert to SOP
            </button>
          )}
        </div>
        <p className="mt-3 text-[11px] text-hiyya-muted">
          Applying stores this as a demo edit for the session (Reset demo clears it) — it
          doesn&apos;t recompute Aug&apos;s reconciled figures on the other tabs.
        </p>
      </div>
    </div>
  );
}
