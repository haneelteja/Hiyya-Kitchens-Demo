"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shell/Header";
import { Tabs } from "@/components/shell/Tabs";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { HeroBand } from "@/components/shell/HeroBand";
import { Footer } from "@/components/shell/Footer";
import { DrilldownDialog } from "@/components/shell/DrilldownDialog";
import { useAppStore } from "@/lib/store/useAppStore";
import { getPersona, tabsForPersona } from "@/lib/access/personas";

export function AppShell({ tab, children }: { tab: string; children: React.ReactNode }) {
  const router = useRouter();
  const personaId = useAppStore((s) => s.personaId);
  const tabs = tabsForPersona(getPersona(personaId));

  useEffect(() => {
    // A persona switch (or a manually-typed URL) can point at a tab the current
    // persona doesn't have — send them to their first valid tab instead of a 404.
    if (!tabs.includes(tab)) {
      router.replace(`/${tabs[0]}`);
    }
  }, [tab, tabs, router]);

  return (
    <div className="min-h-screen">
      <Header />
      <Tabs activeTab={tab} />
      <Breadcrumb />
      <HeroBand />
      <main
        id="tab-panel"
        role="tabpanel"
        aria-label={tab}
        tabIndex={-1}
        className="mx-auto max-w-[1480px] px-6 pb-16 pt-4"
      >
        {tabs.includes(tab) ? children : null}
      </main>
      <Footer />
      <DrilldownDialog />
    </div>
  );
}
