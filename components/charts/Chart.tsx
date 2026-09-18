"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import {
  registerHiyyaEchartsTheme,
  HIYYA_ECHARTS_THEME_NAME,
} from "@/lib/theme/echarts-theme";

registerHiyyaEchartsTheme();

/** Thin shared wrapper: registers the "hiyya" theme once, fixes height, wires
 * click events. Every chart in components/charts/* renders through this. */
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
      notMerge
      onEvents={onClick ? { click: onClick } : undefined}
    />
  );
}
