"use client";

import { useAccessibleScope } from "@/hooks/useAccessibleScope";
import { resolveScopeToBranchCodes } from "@/lib/access/scope";
import { dataset } from "@/lib/data/mock/dataset";
import { formatIstDate } from "@/lib/calc/format";

/** Theme, ownership, owner (hidden for managers), opened date — Section 8. */
export function Breadcrumb() {
  const { persona, scope } = useAccessibleScope();
  const codes = resolveScopeToBranchCodes(scope);

  if (codes.length !== 1) {
    return (
      <p className="px-6 pt-3 text-xs text-hiyya-muted">
        {codes.length} branch{codes.length === 1 ? "" : "es"} in view
      </p>
    );
  }

  const branch = dataset.branches.find((b) => b.code === codes[0]);
  if (!branch) return null;

  const chips = [
    branch.theme,
    branch.ownership === "brand" ? "Brand-owned" : "Franchise",
    persona.role !== "branch_manager" ? branch.ownerName : null,
    `Opened ${formatIstDate(branch.openedOn)}`,
  ].filter((c): c is string => Boolean(c));

  return (
    <div className="flex flex-wrap gap-2 px-6 pt-3">
      {chips.map((chip) => (
        <span
          key={chip}
          className="rounded-md border border-hiyya-panel-2 bg-white/[0.02] px-2 py-0.5 text-[11px] text-hiyya-muted"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}
