"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { useThemeColors } from "@/hooks/useThemeColors";
import { registerHiyyaEchartsTheme, echartsThemeName } from "@/lib/theme/echarts-theme";

/**
 * Thin shared wrapper: registers the active theme's ECharts palette (once per
 * theme — see registerHiyyaEchartsTheme's guard), fixes height, wires click
 * events. Every chart in components/charts/* renders through this.
 *
 * `notMerge` defaults to unset — every caller is expected to pass a
 * `useMemo`-stabilized `option` (see TrendChart etc.), so a genuinely
 * unchanged option keeps the same reference and ECharts skips the update
 * entirely; a changed one gets its default diff-merge instead of a full
 * destroy-and-rebuild on every unrelated parent re-render (perf review,
 * Section 2, P0). The one exception is a chart whose series can change
 * *shape* at runtime (e.g. TrendChart's combined-vs-by-branch toggle,
 * 3 series vs. 8): ECharts' diff-merge only overwrites series by index, so
 * shrinking the array leaves the old higher-index series behind instead of
 * clearing them — that caller opts into `notMerge` explicitly.
 */
export function Chart({
  option,
  height = 280,
  onClick,
  notMerge,
}: {
  option: EChartsOption;
  height?: number;
  onClick?: (params: unknown) => void;
  notMerge?: boolean;
}) {
  const { theme } = useThemeColors();
  registerHiyyaEchartsTheme(theme);

  return (
    <ReactECharts
      option={option}
      notMerge={notMerge}
      theme={echartsThemeName(theme)}
      style={{ height, width: "100%" }}
      onEvents={onClick ? { click: onClick } : undefined}
    />
  );
}
