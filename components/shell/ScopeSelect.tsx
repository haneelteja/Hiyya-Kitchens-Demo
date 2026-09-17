"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store/useAppStore";
import { getPersona } from "@/lib/access/personas";
import { dataset } from "@/lib/data/mock/dataset";
import type { BranchCode, Scope, ThemeName } from "@/lib/data/types";

function scopeToValue(scope: Scope): string {
  switch (scope.kind) {
    case "all":
      return "all";
    case "branch":
      return `branch:${scope.branchCode}`;
    case "theme":
      return `theme:${scope.theme}`;
    case "owner":
      return `owner:${scope.ownerName}`;
    case "own":
      return "own";
  }
}

function valueToScope(value: string): Scope {
  if (value === "all") return { kind: "all" };
  if (value === "own") {
    const codes = dataset.branches.map((b) => b.code); // narrowed again by accessibleBranchCodes downstream
    return { kind: "own", branchCodes: codes };
  }
  const [kind, rest] = value.split(":");
  if (kind === "branch") return { kind: "branch", branchCode: rest as BranchCode };
  if (kind === "theme") return { kind: "theme", theme: rest as ThemeName };
  return { kind: "owner", ownerName: rest };
}

/** Header scope select — disabled when the persona has exactly one branch (Section 8). */
export function ScopeSelect() {
  const personaId = useAppStore((s) => s.personaId);
  const scope = useAppStore((s) => s.scope);
  const setScope = useAppStore((s) => s.setScope);
  const persona = getPersona(personaId);

  const isBrandWide = persona.role === "brand_owner" || persona.role === "brand_manager";
  const ownedCodes = Array.isArray(persona.branchCodes) ? persona.branchCodes : [];
  const isMultiOwn = persona.role === "branch_owner" && ownedCodes.length > 1;

  if (!isBrandWide && !isMultiOwn) {
    // Exactly one branch: the scope select is disabled outright, not just hidden,
    // so a keyboard/screen-reader user learns *why* rather than finding it missing.
    const only = dataset.branches.find((b) => ownedCodes.includes(b.code));
    return (
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-hiyya-muted">
          Scope
        </label>
        <div className="flex h-9 min-w-[200px] items-center rounded-md border border-hiyya-panel-2 bg-hiyya-panel-2 px-3 text-sm text-hiyya-muted opacity-70">
          {only?.name ?? "Single branch"}
        </div>
      </div>
    );
  }

  const owners = [...new Set(dataset.branches.map((b) => b.ownerName))];

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="scope-select"
        className="text-[10px] font-bold uppercase tracking-widest text-hiyya-muted"
      >
        Scope
      </label>
      <Select
        value={scopeToValue(scope)}
        onValueChange={(v) => setScope(valueToScope(v))}
      >
        <SelectTrigger
          id="scope-select"
          className="min-w-[220px] border-hiyya-panel-2 bg-hiyya-panel-2"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {isBrandWide ? (
            <>
              <SelectGroup>
                <SelectItem value="all">All branches</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Single branch</SelectLabel>
                {dataset.branches.map((b) => (
                  <SelectItem key={b.code} value={`branch:${b.code}`}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Theme</SelectLabel>
                {dataset.themes.map((t) => (
                  <SelectItem key={t.name} value={`theme:${t.name}`}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Owner portfolio</SelectLabel>
                {owners.map((o) => (
                  <SelectItem key={o} value={`owner:${o}`}>
                    {o}
                  </SelectItem>
                ))}
              </SelectGroup>
            </>
          ) : (
            <SelectGroup>
              <SelectItem value="own">All my branches</SelectItem>
              {ownedCodes.map((code) => {
                const b = dataset.branches.find((x) => x.code === code)!;
                return (
                  <SelectItem key={code} value={`branch:${code}`}>
                    {b.name}
                  </SelectItem>
                );
              })}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
