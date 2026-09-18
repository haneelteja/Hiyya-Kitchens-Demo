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
import { GlanceTab } from "@/components/tabs/GlanceTab";
import { BranchExpensesTab } from "@/components/tabs/BranchExpensesTab";
import { TodayTab } from "@/components/tabs/TodayTab";
import { PurchasesTab } from "@/components/tabs/PurchasesTab";
import { StockSopTab } from "@/components/tabs/StockSopTab";
import { WastageTab } from "@/components/tabs/WastageTab";
import type { PersonaRole } from "@/lib/data/types";

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

type TabComponent = () => JSX.Element | null;

/**
 * Per-role tab components, not a single flat tab-id map — brand and branch-owner
 * roles both use the "sales"/"sop" tab id, but "expenses" means something
 * different for each (Brand: read-only P&L breakdown; Branch Owner: an editable
 * fixed-cost grid, Section 5). AppShell already redirects a persona off any tab
 * not in tabsForPersona(), so a role only ever sees its own row here.
 */
const ROLE_TAB_COMPONENTS: Partial<Record<PersonaRole, Record<string, TabComponent>>> = {
  brand_owner: {
    overview: OverviewTab,
    sales: SalesTab,
    expenses: ExpensesTab,
    sop: SopTab,
    branches: BranchesTab,
    revshare: RevshareTab,
  },
  brand_manager: {
    overview: OverviewTab,
    sales: SalesTab,
    expenses: ExpensesTab,
    sop: SopTab,
    branches: BranchesTab,
    sop_recipes: SopRecipesTab,
    revshare: RevshareTab,
  },
  branch_owner: {
    glance: GlanceTab,
    sales: SalesTab,
    expenses: BranchExpensesTab,
    sop: SopTab,
  },
  branch_manager: {
    today: TodayTab,
    purchases: PurchasesTab,
    stock_sop: StockSopTab,
    wastage: WastageTab,
  },
};

/** The tab router: the persona decides which tabs exist (enforced in AppShell,
 * which redirects off an inaccessible tab). All six personas across all four
 * roles now have their real tabs (Phases 3–6). */
export default function TabPage() {
  const params = useParams<{ tab: string }>();
  const tab = params.tab;
  const personaId = useAppStore((s) => s.personaId);
  const role = getPersona(personaId).role;

  const RealTab = ROLE_TAB_COMPONENTS[role]?.[tab];

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
