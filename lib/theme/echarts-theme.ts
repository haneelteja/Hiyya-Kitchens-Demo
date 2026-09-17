import * as echarts from "echarts/core";
import { formatInr } from "@/lib/calc/format";
import { goldRamp, hiyyaColors } from "@/lib/theme/tokens";

export const HIYYA_ECHARTS_THEME_NAME = "hiyya";

let registered = false;

/**
 * Registers the "hiyya" ECharts theme once: transparent background, muted axis
 * labels, hairline grid, gold series order, ₹ formatters, rich tooltips. Call this
 * before any <ReactECharts theme="hiyya" /> mounts — components/charts/* do this
 * at module load, so importing any chart component is enough.
 */
export function registerHiyyaEchartsTheme() {
  if (registered) return;
  registered = true;

  echarts.registerTheme(HIYYA_ECHARTS_THEME_NAME, {
    color: goldRamp,
    backgroundColor: "transparent",
    textStyle: { color: hiyyaColors.text, fontFamily: "var(--font-sans)" },
    title: {
      textStyle: { color: hiyyaColors.champagne },
      subtextStyle: { color: hiyyaColors.muted },
    },
    legend: { textStyle: { color: hiyyaColors.muted } },
    tooltip: {
      backgroundColor: hiyyaColors.panel2,
      borderColor: "#332B1C",
      borderWidth: 1,
      textStyle: { color: hiyyaColors.text },
    },
    categoryAxis: {
      axisLine: { lineStyle: { color: "#332B1C" } },
      axisTick: { lineStyle: { color: "#332B1C" } },
      axisLabel: { color: hiyyaColors.muted },
      splitLine: { show: false },
    },
    valueAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: hiyyaColors.muted },
      splitLine: { lineStyle: { color: "#1B1813", width: 1, type: "solid" } },
    },
    line: { itemStyle: { borderWidth: 2 }, lineStyle: { width: 2.5 }, symbolSize: 6 },
    bar: { itemStyle: { borderRadius: [3, 3, 0, 0] } },
  });
}

/** Standard ₹ tooltip/axis formatters, shared by every chart for consistency. */
export const echartsInrAxisFormatter = (value: number) =>
  formatInr(value, { compact: true });
export const echartsInrTooltipFormatter = (value: number) => formatInr(value);
