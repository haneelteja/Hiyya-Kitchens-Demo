"use client";

import { useEffect, useMemo, useState } from "react";
import { useDataSource } from "@/hooks/useDataSource";
import { useAccessibleScope } from "@/hooks/useAccessibleScope";
import {
  SopRecipeEditor,
  type IngredientTotals,
} from "@/components/forms/SopRecipeEditor";
import { dataset } from "@/lib/data/mock/dataset";
import { accessibleBranchCodes } from "@/lib/access/scope";
import type { IngredientVarianceRow, TopItemRow } from "@/lib/data/DataSource";
import type { BranchCode } from "@/lib/data/types";

const PERIOD = "2026-08";

const ingredientInfo: Record<
  string,
  { name: string; unit: string; standardRate: number }
> = Object.fromEntries(
  dataset.ingredients.map((i) => [
    i.key,
    { name: i.name, unit: i.unit, standardRate: i.standardRate },
  ]),
);

function branchName(code: string): string {
  return dataset.branches.find((b) => b.code === code)?.name ?? code;
}

/**
 * Brand Manager only (Section 5). Lets a brand manager propose a recipe-quantity
 * change and see its modelled effect on deviation before deciding to apply it —
 * see components/forms/SopRecipeEditor.tsx for the calculation and its documented
 * limits.
 */
export function SopRecipesTab() {
  const ds = useDataSource();
  const { persona, scope } = useAccessibleScope();
  const branchCodes = useMemo(
    () => accessibleBranchCodes(persona, scope),
    [persona, scope],
  );
  const [varianceRows, setVarianceRows] = useState<IngredientVarianceRow[]>([]);
  const [topItemsAll, setTopItemsAll] = useState<TopItemRow[]>([]);
  const [topItemsByBranch, setTopItemsByBranch] = useState<Record<string, TopItemRow[]>>(
    {},
  );

  useEffect(() => {
    let cancelled = false;
    ds.getIngredientVariance(scope, PERIOD).then((r) => {
      if (!cancelled) setVarianceRows(r);
    });
    ds.getTopItems(scope, PERIOD, "sales").then((r) => {
      if (!cancelled) setTopItemsAll(r);
    });
    Promise.all(
      branchCodes.map((code: BranchCode) =>
        ds
          .getTopItems({ kind: "branch", branchCode: code }, PERIOD, "sales")
          .then((rows) => [code, rows] as const),
      ),
    ).then((pairs) => {
      if (!cancelled) setTopItemsByBranch(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
  }, [ds, scope, branchCodes]);

  const totalsForIngredient = useMemo(
    () =>
      (ingredientKey: string, appliesTo: string): IngredientTotals => {
        const rows =
          appliesTo === "ALL"
            ? varianceRows.filter((r) => r.ingredientKey === ingredientKey)
            : varianceRows.filter(
                (r) => r.ingredientKey === ingredientKey && r.branchCode === appliesTo,
              );
        return rows.reduce(
          (acc, r) => ({
            sopUsageQty: acc.sopUsageQty + r.sopUsageQty,
            actualUsageQty: acc.actualUsageQty + r.actualUsageQty,
            wastageQty: acc.wastageQty + r.wastageQty,
          }),
          { sopUsageQty: 0, actualUsageQty: 0, wastageQty: 0 },
        );
      },
    [varianceRows],
  );

  const portionsForItem = useMemo(
    () =>
      (menuItemCode: string, appliesTo: string): number => {
        const rows =
          appliesTo === "ALL" ? topItemsAll : (topItemsByBranch[appliesTo] ?? []);
        return rows.find((r) => r.code === menuItemCode)?.estQty ?? 0;
      },
    [topItemsAll, topItemsByBranch],
  );

  const appliesToLabel = useMemo(
    () =>
      (appliesTo: string): string =>
        appliesTo === "ALL" ? "All branches" : branchName(appliesTo),
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/40 p-4">
        <h2 className="font-heading text-lg font-semibold text-hiyya-champagne">
          SOP recipes
        </h2>
        <p className="mt-1 text-xs text-hiyya-muted">
          Every menu item&apos;s recipe — quantity per portion, by ingredient. Branch
          overrides (like B01&apos;s Chicken Juicy Mandi) replace the generic line for
          that branch only.
        </p>
      </div>
      <SopRecipeEditor
        menuItems={dataset.menuItems}
        sopLines={dataset.sopLines}
        ingredientInfo={ingredientInfo}
        totalsForIngredient={totalsForIngredient}
        portionsForItem={portionsForItem}
        appliesToLabel={appliesToLabel}
      />
    </div>
  );
}
