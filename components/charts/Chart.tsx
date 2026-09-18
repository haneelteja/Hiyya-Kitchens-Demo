"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import {
  registerHiyyaEchartsTheme,
  HIYYA_ECHARTS_THEME_NAME,
} from "@/lib/theme/echarts-theme";

registerHiyyaEchartsTheme();

/**
 * Thin shared wrapper: registers the "hiyya" theme once, fixes height, wires
 * click events. Every chart in components/charts/* renders through this.
 *
 * No `notMerge` — every caller is expected to pass a `useMemo`-stabilized
 * `option` (see TrendChart etc.), so a genuinely unchanged option keeps the
 * same reference and ECharts skips the update entirely; a changed one gets
 * its default diff-merge instead of a full destroy-and-rebuild on every
 * unrelated parent re-render (perf review, Section 2, P0).
 */
export function Chart({
  option,
  height = 280,
  onClick,
}: {
  option: EChartsOption;
  height?: number;
  onClick?: (params: unknown) => void;
}) {
  return (
    <ReactECharts
      option={option}
      theme={HIYYA_ECHARTS_THEME_NAME}
      style={{ height, width: "100%" }}
      onEvents={onClick ? { click: onClick } : undefined}
    />
  );
}
