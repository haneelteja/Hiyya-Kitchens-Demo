"use client";

import { useHeroCopy } from "@/hooks/useHeroCopy";

/**
 * ~230px tall, text left, 3D throne visible on the right (Section 8). The throne
 * itself is the global fixed <ThreeStage> canvas behind the whole app (Section 9) —
 * this band just reserves the visual space and holds the data-driven headline.
 * On screens under 760px the throne moves below the text at a smaller scale
 * (handled by ThreeStage itself); this band grows taller to match.
 */
export function HeroBand() {
  const { headline, detail, loading } = useHeroCopy();

  return (
    <div className="relative flex min-h-[230px] flex-col justify-center px-6 py-8 max-[759px]:min-h-[340px]">
      {/* pt matches the h1's own line-height + the p's margin/line-height below, so
          the skeleton-to-real-content swap doesn't re-center this flex column at a
          different height and shift the headline (a real, measured CLS source —
          Phase 7 polish). Loading and loaded states now occupy the same footprint. */}
      <div className="max-w-xl pt-1 [text-shadow:0_2px_18px_rgba(0,0,0,0.6)]">
        {loading ? (
          <>
            <div className="h-9 w-3/4 animate-pulse rounded bg-white/5 sm:h-11" />
            <div className="mt-3 h-5 w-1/2 animate-pulse rounded bg-white/5" />
          </>
        ) : (
          <>
            <h1 className="font-heading text-3xl font-semibold leading-tight text-hiyya-champagne sm:text-4xl">
              {headline}
            </h1>
            <p className="mt-3 text-sm text-hiyya-muted sm:text-base">{detail}</p>
          </>
        )}
      </div>
    </div>
  );
}
