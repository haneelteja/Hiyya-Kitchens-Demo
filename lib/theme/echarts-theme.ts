import * as echarts from "echarts/core";
import { formatInr } from "@/lib/calc/format";
import { getGoldRamp, getHiyyaColors, type ThemeMode } from "@/lib/theme/tokens";

const THEME_NAMES: Record<ThemeMode, string> = {
  dark: "hiyya-dark",
  pastel: "hiyya-pastel",
};

export function echartsThemeName(theme: ThemeMode): string {
  return THEME_NAMES[theme];
}

const registered = new Set<ThemeMode>();

/**
 * Registers the given theme's ECharts palette once: transparent background,
 * muted axis labels, hairline grid, themed series order, rich tooltips.
 * Idempotent per theme (the `registered` guard), so `Chart.tsx` can call this
 * on every render with whichever theme is active without re-registering.
 */
export function registerHiyyaEchartsTheme(theme: ThemeMode) {
  if (registered.has(theme)) return;
  registered.add(theme);

  const c = getHiyyaColors(theme);
  echarts.registerTheme(THEME_NAMES[theme], {
    color: getGoldRamp(theme),
    backgroundColor: "transparent",
    textStyle: { color: c.text, fontFamily: "var(--font-sans)" },
    title: {
      textStyle: { color: c.champagne },
      subtextStyle: { color: c.muted },
    },
    legend: { textStyle: { color: c.muted } },
    tooltip: {
      backgroundColor: c.panel2,
      borderColor: c.border,
      borderWidth: 1,
      textStyle: { color: c.text },
    },
    categoryAxis: {
      axisLine: { lineStyle: { color: c.border } },
      axisTick: { lineStyle: { color: c.border } },
      axisLabel: { color: c.muted },
      splitLine: { show: false },
    },
    valueAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: c.muted },
      splitLine: { lineStyle: { color: c.gridLine, width: 1, type: "solid" } },
    },
    line: { itemStyle: { borderWidth: 2 }, lineStyle: { width: 2.5 }, symbolSize: 6 },
    bar: { itemStyle: { borderRadius: [3, 3, 0, 0] } },
  });
}

/** Standard ₹ tooltip/axis formatters, shared by every chart for consistency. */
export const echartsInrAxisFormatter = (value: number) =>
  formatInr(value, { compact: true });
export const echartsInrTooltipFormatter = (value: number) => formatInr(value);
