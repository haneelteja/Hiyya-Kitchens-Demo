"use client";

import { PersonaSwitcher } from "@/components/shell/PersonaSwitcher";
import { ScopeSelect } from "@/components/shell/ScopeSelect";
import { MotionToggle } from "@/components/shell/MotionToggle";
import { ResetDemoButton } from "@/components/shell/ResetDemoButton";
import { useAppStore } from "@/lib/store/useAppStore";
import { getPersona } from "@/lib/access/personas";

const ROLE_LABEL: Record<string, string> = {
  brand_owner: "Brand Owner",
  brand_manager: "Brand Manager",
  branch_owner: "Branch Owner",
  branch_manager: "Branch Manager",
};

export function Header() {
  const personaId = useAppStore((s) => s.personaId);
  const persona = getPersona(personaId);
  const initials = persona.label
    .split(":")[1]
    ?.trim()
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-black/85 px-6 py-2 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-5">
        <div className="mr-auto flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-gradient-to-br from-hiyya-champagne via-hiyya-gold to-hiyya-deep-gold font-heading text-lg font-bold text-black">
            H
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-xl font-bold">
                HIYYA Kitchens Command Center
              </span>
              <span className="rounded-full border border-hiyya-gold/40 bg-hiyya-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-hiyya-gold">
                Demo
              </span>
            </div>
            <p className="-mt-0.5 text-[10px] uppercase tracking-[0.14em] text-hiyya-muted">
              Get arrested by taste
            </p>
          </div>
        </div>

        <PersonaSwitcher />
        <ScopeSelect />

        <div className="flex items-center gap-2 rounded-full border border-hiyya-panel-2 bg-hiyya-panel-2 py-1 pl-1 pr-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-hiyya-gold text-[11px] font-bold text-black">
            {initials}
          </div>
          <div className="leading-tight">
            <div className="text-xs font-bold">{persona.label.split(":")[1]?.trim()}</div>
            <div className="text-[10px] text-hiyya-muted">{ROLE_LABEL[persona.role]}</div>
          </div>
        </div>

        <MotionToggle />
        <ResetDemoButton />
      </div>
    </header>
  );
}
