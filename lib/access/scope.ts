import type { Branch, BranchCode, Persona, Scope } from "@/lib/data/types";
import { dataset } from "@/lib/data/mock/dataset";

/**
 * Resolves a Scope to concrete branch codes against the dataset alone — no persona,
 * no access rules. This is what a brand-wide scope *means*, not who's allowed to ask
 * for it. DataSource (and MockDataSource) call this and only this; they never see a
 * Persona. Access enforcement happens once, below, before a Scope is ever built.
 */
export function resolveScopeToBranchCodes(scope: Scope): BranchCode[] {
  switch (scope.kind) {
    case "all":
      return allBranchCodes();
    case "branch":
      return [scope.branchCode];
    case "theme":
      return dataset.branches.filter((b) => b.theme === scope.theme).map((b) => b.code);
    case "owner":
      return dataset.branches
        .filter((b) => b.ownerName === scope.ownerName)
        .map((b) => b.code);
    case "own":
      return scope.branchCodes;
  }
}

/**
 * Resolves which branch codes a persona + chosen scope may see. This is the one
 * function every data-fetching hook must call before touching lib/data — the
 * result is the only Scope value that's safe to pass on to a DataSource method.
 * Access control lives here, never only in a component (CLAUDE.md).
 */
export function accessibleBranchCodes(persona: Persona, scope: Scope): BranchCode[] {
  if (persona.role === "brand_owner" || persona.role === "brand_manager") {
    return resolveScopeToBranchCodes(scope);
  }

  // Branch Owner / Branch Manager: never see outside their own membership, no matter
  // what scope was requested. This is the enforcement point for "Suresh never sees
  // Chrono Jail Mandi or Space Mandi" — it's structural, not a UI filter, and it
  // ignores whatever the requested scope claims if that scope reaches outside the
  // persona's own branches.
  const own = persona.branchCodes === "all" ? allBranchCodes() : persona.branchCodes;
  if (scope.kind === "branch" && own.includes(scope.branchCode)) {
    return [scope.branchCode];
  }
  return own;
}

function allBranchCodes(): BranchCode[] {
  return dataset.branches.map((b) => b.code);
}

export function branchesInScope(persona: Persona, scope: Scope): Branch[] {
  const codes = accessibleBranchCodes(persona, scope);
  return dataset.branches.filter((b) => codes.includes(b.code));
}

/** Branch Managers never see P&L (Section 3/5) — gate financial views on role, not scope. */
export function canSeePnl(persona: Persona): boolean {
  return persona.role !== "branch_manager";
}

/** Only Brand Owner/Manager manage SOP recipes, users, branches, themes, royalty terms. */
export function canEditSopRecipes(persona: Persona): boolean {
  return persona.role === "brand_manager" || persona.role === "brand_owner";
}

/** Branch Owners enter fixed costs; Branch Managers record purchases/stock/wastage. */
export function canEditFixedCosts(persona: Persona): boolean {
  return persona.role === "branch_owner";
}

export function canRecordOperationalEntries(persona: Persona): boolean {
  return persona.role === "branch_manager";
}

/**
 * Branch Owners with multiple branches get ranks only, never another branch's name
 * or value — this returns the shape the UI is allowed to render, nothing richer.
 */
export function anonymizedBenchmarkAllowed(persona: Persona): boolean {
  return persona.role === "branch_owner";
}
