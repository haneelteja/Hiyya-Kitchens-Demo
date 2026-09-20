import type { Persona, PersonaId } from "@/lib/data/types";
import { dataset } from "@/lib/data/mock/dataset";

/** The four demo personas, in the header switcher's order (spec Section 5). */
export function listPersonas(): Persona[] {
  return dataset.personas;
}

export function getPersona(id: PersonaId): Persona {
  const persona = dataset.personas.find((p) => p.id === id);
  if (!persona) throw new Error(`Unknown persona id: ${id}`);
  return persona;
}

/** Tab sets per role (spec Section 5). Brand Manager adds "SOP recipes" after Branches. */
export const TAB_SETS = {
  brand_owner: ["overview", "sales", "expenses", "sop", "branches", "revshare"] as const,
  brand_manager: [
    "overview",
    "sales",
    "expenses",
    "sop",
    "branches",
    "sop_recipes",
    "revshare",
  ] as const,
  branch_owner: ["glance", "sales", "expenses", "sop"] as const,
  branch_manager: ["today", "purchases", "stock_sop", "wastage"] as const,
};
export type TabId = (typeof TAB_SETS)[keyof typeof TAB_SETS][number];

export function tabsForPersona(persona: Persona): readonly string[] {
  return TAB_SETS[persona.role];
}
