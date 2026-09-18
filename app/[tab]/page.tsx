"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { TabSkeleton } from "@/components/kpi/TabSkeleton";
import { useAppStore } from "@/lib/store/useAppStore";
import { getPersona } from "@/lib/access/personas";
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

type TabComponent = ComponentType<Record<string, never>>;

// Every tab component is dynamically imported (next/dynamic, no SSR) rather
// than statically imported above — a Brand Owner's browser has no reason to
// ever download Branch Manager's Purchases/Wastage forms or vice versa. Before
// this, app/[tab]/page.tsx statically imported all 13 tab components for all
// four roles into one shared client bundle regardless of which single role a
// session ever needed; that inflated the /[tab] route's First Load JS and was
// the single biggest contributor to a 48/100 Lighthouse performance score on
// Overview (Phase 7 polish). Splitting each into its own lazily-loaded chunk
// means a session only ever downloads its own role's tabs, and even within a
// role, only the currently-open tab's code — the other tabs in that role's
// row load on demand the moment their pill is clicked, not before.
function lazyTab(loader: () => Promise<{ [key: string]: TabComponent }>, named: string) {
  return dynamic(() => loader().then((m) => m[named]), {
    ssr: false,
    // Without this, a chunk still in flight (slow connection, or simply the
    // first time this role's tab is opened this session) renders nothing at
    // all — a second, code-level version of the same blank-panel gap the
    // per-tab data-loading skeletons address below.
    loading: () => <TabSkeleton />,
  });
}

const OverviewTab = lazyTab(() => import("@/components/tabs/OverviewTab"), "OverviewTab");
const SalesTab = lazyTab(() => import("@/components/tabs/SalesTab"), "SalesTab");
const ExpensesTab = lazyTab(() => import("@/components/tabs/ExpensesTab"), "ExpensesTab");
const SopTab = lazyTab(() => import("@/components/tabs/SopTab"), "SopTab");
const BranchesTab = lazyTab(() => import("@/components/tabs/BranchesTab"), "BranchesTab");
const RevshareTab = lazyTab(() => import("@/components/tabs/RevshareTab"), "RevshareTab");
const SopRecipesTab = lazyTab(
  () => import("@/components/tabs/SopRecipesTab"),
  "SopRecipesTab",
);
const GlanceTab = lazyTab(() => import("@/components/tabs/GlanceTab"), "GlanceTab");
const BranchExpensesTab = lazyTab(
  () => import("@/components/tabs/BranchExpensesTab"),
  "BranchExpensesTab",
);
const TodayTab = lazyTab(() => import("@/components/tabs/TodayTab"), "TodayTab");
const PurchasesTab = lazyTab(
  () => import("@/components/tabs/PurchasesTab"),
  "PurchasesTab",
);
const StockSopTab = lazyTab(() => import("@/components/tabs/StockSopTab"), "StockSopTab");
const WastageTab = lazyTab(() => import("@/components/tabs/WastageTab"), "WastageTab");

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
