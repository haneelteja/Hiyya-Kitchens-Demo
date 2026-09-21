"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { BackgroundLayer } from "@/components/shell/BackgroundLayer";
import { useAppStore } from "@/lib/store/useAppStore";

/**
 * Root client wrapper: a fixed full-viewport themed background at z-0, page
 * content at z-[2]. Mounted once from app/layout.tsx (a Server Component, so
 * it keeps its `metadata` export) — this is the client boundary. Also keeps
 * `<html data-theme>` in sync with the store: the theme choice persists in
 * localStorage, and the CSS in app/globals.css keys off that attribute to
 * pick the right palette.
 */
export function AppFrame({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <>
      <BackgroundLayer />
      <div className="relative z-[2]">{children}</div>
      <Toaster />
    </>
  );
}
