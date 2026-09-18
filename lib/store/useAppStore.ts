import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  BranchCode,
  FixedCostHead,
  PersonaId,
  Scope,
  WastageReason,
} from "@/lib/data/types";
import { getPersona, tabsForPersona } from "@/lib/access/personas";

export type Grain = "daily" | "weekly" | "monthly";

/** In-memory-only demo edits (Section 4 guardrails — never localStorage). */
export interface DemoEdits {
  fixedCostOverrides: Record<string, number>; // key: `${branchCode}:${month}:${head}`
  purchases: Array<{
    id: string;
    branchCode: BranchCode;
    ingredientKey: string;
    qty: number;
    ratePaid: number;
    supplier: string;
    date: string;
  }>;
  wastageEntries: Array<{
    id: string;
    branchCode: BranchCode;
    ingredientKey: string;
    qty: number;
    reason: WastageReason;
    date: string;
  }>;
  sopOverrides: Record<string, number>; // key: `${menuItemCode}:${ingredientKey}:${branchCode}`
}

const initialDemoEdits: DemoEdits = {
  fixedCostOverrides: {},
  purchases: [],
  wastageEntries: [],
  sopOverrides: {},
};

/** The single global drill-down dialog's content (Section 8: click a bar/slice/row
 * to drill in). One dialog, rendered once in AppShell, driven by this state. */
export type Drilldown =
  | { type: "branch"; branchCode: BranchCode }
  | {
      type: "ingredient";
      ingredientKey: string;
      ingredientName: string;
      branchCodes: BranchCode[];
    }
  | null;

export function fixedCostOverrideKey(
  branchCode: string,
  month: string,
  head: FixedCostHead,
) {
  return `${branchCode}:${month}:${head}`;
}

interface AppState {
  personaId: PersonaId;
  scope: Scope;
  grain: Grain;
  period: string; // "YYYY-MM"
  motionEnabled: boolean;
  demoEdits: DemoEdits;
  drilldown: Drilldown;

  setPersona: (id: PersonaId) => void;
  setScope: (scope: Scope) => void;
  setGrain: (grain: Grain) => void;
  toggleMotion: () => void;
  openBranchDrilldown: (branchCode: BranchCode) => void;
  openIngredientDrilldown: (
    ingredientKey: string,
    ingredientName: string,
    branchCodes: BranchCode[],
  ) => void;
  closeDrilldown: () => void;

  setFixedCostOverride: (
    branchCode: string,
    month: string,
    head: FixedCostHead,
    amount: number,
  ) => void;
  clearFixedCostOverride: (
    branchCode: string,
    month: string,
    head: FixedCostHead,
  ) => void;
  addPurchase: (p: Omit<DemoEdits["purchases"][number], "id">) => void;
  addWastageEntry: (w: Omit<DemoEdits["wastageEntries"][number], "id">) => void;
  setSopOverride: (
    menuItemCode: string,
    ingredientKey: string,
    appliesTo: string,
    qtyPerPortion: number,
  ) => void;
  clearSopOverride: (
    menuItemCode: string,
    ingredientKey: string,
    appliesTo: string,
  ) => void;
  resetDemoEdits: () => void;
}

export function sopOverrideKey(
  menuItemCode: string,
  ingredientKey: string,
  appliesTo: string,
) {
  return `${menuItemCode}:${ingredientKey}:${appliesTo}`;
}

function defaultScopeFor(personaId: PersonaId): Scope {
  const persona = getPersona(personaId);
  if (persona.role === "brand_owner" || persona.role === "brand_manager") {
    return { kind: "all" };
  }
  if (Array.isArray(persona.branchCodes) && persona.branchCodes.length > 1) {
    return { kind: "own", branchCodes: persona.branchCodes };
  }
  const only = Array.isArray(persona.branchCodes) ? persona.branchCodes[0] : undefined;
  return only ? { kind: "branch", branchCode: only } : { kind: "all" };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      personaId: "owner",
      scope: defaultScopeFor("owner"),
      grain: "monthly",
      period: "2026-08",
      motionEnabled: true,
      demoEdits: initialDemoEdits,
      drilldown: null,

      setPersona: (id) => {
        set({ personaId: id, scope: defaultScopeFor(id) });
      },
      setScope: (scope) => set({ scope }),
      setGrain: (grain) => set({ grain }),
      toggleMotion: () => set({ motionEnabled: !get().motionEnabled }),
      openBranchDrilldown: (branchCode) =>
        set({ drilldown: { type: "branch", branchCode } }),
      openIngredientDrilldown: (ingredientKey, ingredientName, branchCodes) =>
        set({
          drilldown: { type: "ingredient", ingredientKey, ingredientName, branchCodes },
        }),
      closeDrilldown: () => set({ drilldown: null }),

      setFixedCostOverride: (branchCode, month, head, amount) =>
        set((state) => ({
          demoEdits: {
            ...state.demoEdits,
            fixedCostOverrides: {
              ...state.demoEdits.fixedCostOverrides,
              [fixedCostOverrideKey(branchCode, month, head)]: amount,
            },
          },
        })),
      clearFixedCostOverride: (branchCode, month, head) =>
        set((state) => {
          const key = fixedCostOverrideKey(branchCode, month, head);
          const rest = { ...state.demoEdits.fixedCostOverrides };
          delete rest[key];
          return { demoEdits: { ...state.demoEdits, fixedCostOverrides: rest } };
        }),
      addPurchase: (p) =>
        set((state) => ({
          demoEdits: {
            ...state.demoEdits,
            purchases: [...state.demoEdits.purchases, { ...p, id: crypto.randomUUID() }],
          },
        })),
      addWastageEntry: (w) =>
        set((state) => ({
          demoEdits: {
            ...state.demoEdits,
            wastageEntries: [
              ...state.demoEdits.wastageEntries,
              { ...w, id: crypto.randomUUID() },
            ],
          },
        })),
      setSopOverride: (menuItemCode, ingredientKey, appliesTo, qtyPerPortion) =>
        set((state) => ({
          demoEdits: {
            ...state.demoEdits,
            sopOverrides: {
              ...state.demoEdits.sopOverrides,
              [sopOverrideKey(menuItemCode, ingredientKey, appliesTo)]: qtyPerPortion,
            },
          },
        })),
      clearSopOverride: (menuItemCode, ingredientKey, appliesTo) =>
        set((state) => {
          const key = sopOverrideKey(menuItemCode, ingredientKey, appliesTo);
          const rest = { ...state.demoEdits.sopOverrides };
          delete rest[key];
          return { demoEdits: { ...state.demoEdits, sopOverrides: rest } };
        }),
      resetDemoEdits: () => set({ demoEdits: initialDemoEdits }),
    }),
    {
      // Only the motion preference persists (Section 4/14 guardrail) — everything
      // else in this store, including all demo edits, resets on refresh.
      name: "hiyya-motion-preference",
      partialize: (state) => ({ motionEnabled: state.motionEnabled }),
    },
  ),
);

export function currentTabs(): readonly string[] {
  const persona = getPersona(useAppStore.getState().personaId);
  return tabsForPersona(persona);
}
