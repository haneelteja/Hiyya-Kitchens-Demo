"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";

const TAB_TITLES: Record<string, string> = {
  overview: "Overview",
  sales: "Sales",
  expenses: "Expenses & profit",
  sop: "SOP & wastage",
  branches: "Branches",
  sop_recipes: "SOP recipes",
  revshare: "Revenue share",
  glance: "At a glance",
  today: "Today",
  purchases: "Purchases",
  stock_sop: "Stock & SOP",
  wastage: "Wastage",
};

/**
 * The tab router (Section 3/8 repo layout): the persona decides which tabs exist
 * (enforced in AppShell, which redirects off an inaccessible tab). Real content
 * per tab lands in Phases 3–6; this phase proves the shell, routing, and access
 * gate all work end to end.
 */
export default function TabPage() {
  const params = useParams<{ tab: string }>();
  const tab = params.tab;

  return (
    <AppShell tab={tab}>
      <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/40 p-8 text-center">
        <h2 className="font-heading text-xl font-semibold text-hiyya-champagne">
          {TAB_TITLES[tab] ?? tab}
        </h2>
        <p className="mt-2 text-sm text-hiyya-muted">
          The full {TAB_TITLES[tab]?.toLowerCase() ?? tab} view arrives in a later phase.
          Phase 2 delivers the shell around it: persona switching, scope, tabs,
          breadcrumb, the hero band, and the 3D throne stage behind everything.
        </p>
      </div>
    </AppShell>
  );
}
