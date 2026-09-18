"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { useAppStore } from "@/lib/store/useAppStore";
import { getPersona } from "@/lib/access/personas";
import { OverviewTab } from "@/components/tabs/OverviewTab";
import { SalesTab } from "@/components/tabs/SalesTab";
import { ExpensesTab } from "@/components/tabs/ExpensesTab";
import { SopTab } from "@/components/tabs/SopTab";
import { BranchesTab } from "@/components/tabs/BranchesTab";
import { RevshareTab } from "@/components/tabs/RevshareTab";
import { SopRecipesTab } from "@/components/tabs/SopRecipesTab";

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

// The six shared Brand Owner/Manager tabs (Phase 3), plus SOP recipes for the
// Brand Manager only (Phase 4) — per Section 5, "Brand Manager: same as owner,
// plus SOP recipes after Branches". AppShell already redirects a persona off
// any tab not in tabsForPersona(), so brand_owner can never render sop_recipes
// even though it's listed in this shared map.
const BRAND_TAB_COMPONENTS: Record<string, () => JSX.Element | null> = {
  overview: OverviewTab,
  sales: SalesTab,
  expenses: ExpensesTab,
  sop: SopTab,
  branches: BranchesTab,
  sop_recipes: SopRecipesTab,
  revshare: RevshareTab,
};

/** The tab router: the persona decides which tabs exist (enforced in AppShell,
 * which redirects off an inaccessible tab). Brand Owner/Manager get their real
 * tabs (Phases 3–4); Branch Owner/Manager still see a placeholder until
 * Phases 5–6. */
export default function TabPage() {
  const params = useParams<{ tab: string }>();
  const tab = params.tab;
  const personaId = useAppStore((s) => s.personaId);
  const role = getPersona(personaId).role;

  const isBrandRole = role === "brand_owner" || role === "brand_manager";
  const RealTab = isBrandRole ? BRAND_TAB_COMPONENTS[tab] : undefined;

  return (
    <AppShell tab={tab}>
      {RealTab ? (
        <RealTab />
      ) : (
        <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/40 p-8 text-center">
          <h2 className="font-heading text-xl font-semibold text-hiyya-champagne">
            {TAB_TITLES[tab] ?? tab}
          </h2>
          <p className="mt-2 text-sm text-hiyya-muted">
            The full {TAB_TITLES[tab]?.toLowerCase() ?? tab} view arrives in a later
            phase.
          </p>
        </div>
      )}
    </AppShell>
  );
}
