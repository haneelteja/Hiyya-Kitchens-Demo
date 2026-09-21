"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { getHiyyaColors, getBranchColors, getGoldRamp } from "@/lib/theme/tokens";

/** The active palette, derived from the current theme. Every chart and
 * themed component reads colors through this instead of a fixed import, so
 * switching themes (dark <-> pastel) repaints every chart too. */
export function useThemeColors() {
  const theme = useAppStore((s) => s.theme);
  return useMemo(
    () => ({
      theme,
      hiyyaColors: getHiyyaColors(theme),
      branchColors: getBranchColors(theme),
      goldRamp: getGoldRamp(theme),
    }),
    [theme],
  );
}
