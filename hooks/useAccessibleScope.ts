"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { getPersona } from "@/lib/access/personas";
import { accessibleBranchCodes } from "@/lib/access/scope";
import type { Persona, Scope } from "@/lib/data/types";

/**
 * The client-side equivalent of "always call accessibleBranchCodes before
 * touching lib/data" — every component that needs a Scope to pass to a DataSource
 * method should use this hook, never `useAppStore((s) => s.scope)` directly. It
 * re-derives a scope that's already clamped to the persona's own branches, so a
 * stale or manipulated store value can never leak another branch's data.
 */
export function useAccessibleScope(): { persona: Persona; scope: Scope } {
  const personaId = useAppStore((s) => s.personaId);
  const rawScope = useAppStore((s) => s.scope);

  return useMemo(() => {
    const persona = getPersona(personaId);
    const codes = accessibleBranchCodes(persona, rawScope);
    // Re-express as an "own" scope over exactly the resolved codes, so
    // MockDataSource's persona-free resolver can't be handed anything wider
    // than what accessibleBranchCodes already decided.
    const safeScope: Scope =
      persona.role === "brand_owner" || persona.role === "brand_manager"
        ? rawScope
        : { kind: "own", branchCodes: codes };
    return { persona, scope: safeScope };
  }, [personaId, rawScope]);
}
