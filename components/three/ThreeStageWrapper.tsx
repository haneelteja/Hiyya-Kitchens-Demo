"use client";

import { useEffect, useState } from "react";
import { ThreeStage } from "@/components/three/ThreeStage";
import { useAppStore } from "@/lib/store/useAppStore";
import { useAccessibleScope } from "@/hooks/useAccessibleScope";
import { resolveScopeToBranchCodes } from "@/lib/access/scope";
import { dataset } from "@/lib/data/mock/dataset";
import { branchColors } from "@/lib/theme/tokens";
import { throneSkinForBranch, throneSkinForBranches } from "@/lib/theme/throneSkins";
import type { OrbitBranch } from "@/components/three/ThroneOrbit";
import type { BranchCode } from "@/lib/data/types";

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

/** Static gold radial gradient — the WebGL-unavailable fallback (Section 9). */
function StaticFallback() {
  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        background:
          "radial-gradient(1200px 700px at 75% 10%, rgba(212,175,55,0.14), transparent 60%), #000000",
      }}
    />
  );
}

/**
 * Orchestrates the 3D throne stage: decides which scene variant the current
 * persona sees, resolves the rim-light branch tint, and applies every pause
 * condition (Section 9) — the user's motion toggle, the tab being hidden, and
 * prefers-reduced-motion. Mounted once from AppFrame, after first paint, so the
 * canvas never delays the rest of the page.
 */
export function ThreeStageWrapper() {
  const motionEnabled = useAppStore((s) => s.motionEnabled);
  const { persona, scope } = useAccessibleScope();

  const [mounted, setMounted] = useState(false);
  const [webglOk, setWebglOk] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Mount after first paint so the canvas never delays charts/content.
    const id = requestAnimationFrame(() => setMounted(true));
    setWebglOk(detectWebGL());

    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onMq = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onMq);

    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("visibilitychange", onVisibility);
      mq.removeEventListener("change", onMq);
    };
  }, []);

  if (!mounted) return null;
  if (!webglOk) return <StaticFallback />;

  const isGrand = persona.role === "brand_owner" || persona.role === "brand_manager";
  const codes = (
    isGrand ? dataset.branches.map((b) => b.code) : resolveScopeToBranchCodes(scope)
  ) as BranchCode[];
  const orbitBranches: OrbitBranch[] = codes.map((code) => ({
    code,
    color: branchColors[code] ?? "#D4AF37",
    skin: throneSkinForBranch(code),
  }));

  const singleBranchScope = resolveScopeToBranchCodes(scope) as BranchCode[];
  const rimColor =
    singleBranchScope.length === 1 ? (branchColors[singleBranchScope[0]] ?? null) : null;
  // Brand-wide views keep the original gold "signature" hero throne; once scope
  // narrows to one branch, the hero itself takes on that branch's theme skin.
  const heroSkin = isGrand ? "signature" : throneSkinForBranches(singleBranchScope);

  const paused = !motionEnabled || tabHidden || reducedMotion;

  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <ThreeStage
        variant={isGrand ? "grand" : "branch"}
        orbitBranches={orbitBranches}
        rimColor={rimColor}
        heroSkin={heroSkin}
        paused={paused}
      />
    </div>
  );
}
