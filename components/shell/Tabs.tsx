"use client";

import Link from "next/link";
import { useRef } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { getPersona, tabsForPersona } from "@/lib/access/personas";
import { cn } from "@/lib/utils";

const TAB_LABELS: Record<string, string> = {
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

/** The persona decides which tabs exist (Section 5). Real ARIA tablist, not decoration. */
export function Tabs({ activeTab }: { activeTab: string }) {
  const personaId = useAppStore((s) => s.personaId);
  const tabs = tabsForPersona(getPersona(personaId));
  const refs = useRef<Array<HTMLAnchorElement | null>>([]);

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex !== null) {
      e.preventDefault();
      refs.current[nextIndex]?.focus();
      refs.current[nextIndex]?.click();
    }
  }

  return (
    <nav
      role="tablist"
      aria-label="Sections"
      className="flex gap-1.5 overflow-x-auto border-b border-hiyya-highlight/5 px-6 py-1.5"
    >
      {tabs.map((tab, i) => {
        const active = tab === activeTab;
        return (
          <Link
            key={tab}
            href={`/${tab}`}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            aria-selected={active}
            aria-controls="tab-panel"
            tabIndex={active ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold transition-colors",
              active
                ? "bg-gradient-to-br from-hiyya-champagne to-hiyya-gold text-black shadow-[0_6px_18px_-8px_rgba(212,175,55,0.7)]"
                : "text-hiyya-muted hover:bg-hiyya-highlight/5 hover:text-hiyya-champagne",
            )}
          >
            {TAB_LABELS[tab] ?? tab}
          </Link>
        );
      })}
    </nav>
  );
}
