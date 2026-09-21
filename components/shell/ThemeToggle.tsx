"use client";

import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/useAppStore";

/** Switches between the dark (black-and-gold) and pastel (cream-and-
 * terracotta) themes. The choice persists (the one exception to "no browser
 * storage for business data" — this is a display preference, not business
 * data). */
export function ThemeToggle() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to pastel theme" : "Switch to dark theme"}
      className="gap-1.5 border-hiyya-panel-2 bg-hiyya-panel-2 text-hiyya-text hover:bg-hiyya-panel-2/70"
    >
      {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      {isDark ? "Pastel theme" : "Dark theme"}
    </Button>
  );
}
