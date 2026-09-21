"use client";

import { useHeroCopy } from "@/hooks/useHeroCopy";

/**
 * A slim, single-line strip — the headline is kept as an <h1> purely for
 * document structure (Phase 7 fixed the app to always have exactly one
 * top-level heading; every KPI card below already shows this same number,
 * so the text itself stays small and unobtrusive rather than a display
 * headline). The 3D throne is the global fixed <ThreeStage> canvas behind
 * the whole app (Section 9) and isn't affected by this band's height.
 */
export function HeroBand() {
  const { headline, loading } = useHeroCopy();

  return (
    <div className="relative flex min-h-[44px] items-center px-6 py-2">
      {loading ? (
        <div className="h-4 w-1/3 animate-pulse rounded bg-hiyya-highlight/5" />
      ) : (
        <h1 className="max-w-xl truncate text-sm font-semibold text-hiyya-muted [text-shadow:0_2px_10px_rgba(0,0,0,0.6)]">
          {headline}
        </h1>
      )}
    </div>
  );
}
