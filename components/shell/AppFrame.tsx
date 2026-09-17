"use client";

import dynamic from "next/dynamic";
import { Toaster } from "@/components/ui/toaster";

const ThreeStageWrapper = dynamic(
  () => import("@/components/three/ThreeStageWrapper").then((m) => m.ThreeStageWrapper),
  { ssr: false },
);

/**
 * Root client wrapper (Section 9 layout): the fixed full-viewport 3D canvas at
 * z-0, a CSS veil gradient at z-1 so content stays legible over any frame, and
 * page content at z-2. Mounted once from app/layout.tsx (a Server Component, so
 * it keeps its `metadata` export) — this is the client boundary.
 */
export function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThreeStageWrapper />
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.72) 55%, rgba(0,0,0,0.92) 100%)",
        }}
        aria-hidden="true"
      />
      <div className="relative z-[2]">{children}</div>
      <Toaster />
    </>
  );
}
