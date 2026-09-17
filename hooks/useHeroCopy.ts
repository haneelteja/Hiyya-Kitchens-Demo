"use client";

import { useEffect, useState } from "react";
import { useDataSource } from "@/hooks/useDataSource";
import { useAccessibleScope } from "@/hooks/useAccessibleScope";
import { formatInr, formatPct } from "@/lib/calc/format";
import { growthPct } from "@/lib/calc/ranks";

export interface HeroCopy {
  headline: string;
  detail: string;
  loading: boolean;
}

const EMPTY: HeroCopy = { headline: "", detail: "", loading: true };

/**
 * Section 8's hero-band headline, generated from data, one persona-role branch:
 * Owners: "Your N branches made ₹X in August" + growth vs July, net profit, SOP loss.
 * Managers: "{Branch} is at Y% of today's target" + sales vs target, reorder count.
 */
export function useHeroCopy(): HeroCopy {
  const ds = useDataSource();
  const { persona, scope } = useAccessibleScope();
  const [copy, setCopy] = useState<HeroCopy>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setCopy((c) => ({ ...c, loading: true }));

      if (
        persona.role === "brand_owner" ||
        persona.role === "brand_manager" ||
        persona.role === "branch_owner"
      ) {
        const branches = await ds.getBranches(scope);
        const [summary, july, variance] = await Promise.all([
          ds.getPnlSummary(scope, "2026-08"),
          ds.getPnlSummary(scope, "2026-07").catch(() => null),
          ds.getIngredientVariance(scope, "2026-08"),
        ]);
        const lostToSop = variance.reduce(
          (s, r) => s + Math.max(0, r.unexplainedValue),
          0,
        );
        const growth = july ? growthPct(summary.netSales, july.netSales) : null;

        const branchWord = branches.length === 1 ? "branch" : "branches";
        const headline = `Your ${branches.length} ${branchWord} made ${formatInr(summary.netSales, { compact: true })} in August`;
        const parts = [
          growth !== null ? `${formatPct(growth)} vs July` : null,
          `net profit ${formatInr(summary.netProfit, { compact: true })}`,
          `${formatInr(lostToSop, { compact: true })} lost beyond SOP`,
        ].filter(Boolean);

        if (!cancelled) setCopy({ headline, detail: parts.join(" · "), loading: false });
        return;
      }

      // branch_manager
      const branches = await ds.getBranches(scope);
      const branch = branches[0];
      if (!branch) {
        if (!cancelled) setCopy({ headline: "", detail: "", loading: false });
        return;
      }
      const snapshot = await ds.getTodaySnapshot(branch.code);
      const pctOfTarget =
        snapshot.target === 0 ? 0 : (snapshot.netSalesToday / snapshot.target) * 100;
      const headline = `${branch.name} is at ${Math.round(pctOfTarget)}% of today's target`;
      const detail = [
        `${formatInr(snapshot.netSalesToday, { compact: true })} vs ${formatInr(snapshot.target, { compact: true })} target`,
        `${snapshot.reorderCount} item${snapshot.reorderCount === 1 ? "" : "s"} to reorder`,
      ].join(" · ");
      if (!cancelled) setCopy({ headline, detail, loading: false });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [ds, persona, scope]);

  return copy;
}
