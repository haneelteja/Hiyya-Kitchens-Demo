"use client";

import { Chart } from "@/components/charts/Chart";
import { formatInr } from "@/lib/calc/format";

export interface StackedSeries {
  name: string;
  color: string;
  data: number[];
  key?: string; // for click identification, e.g. branchCode
}

/** Generic stacked bar chart — used for "daily sales by branch" (₹) and "expense
 * structure by branch" (100%) (Section 8). Click a bar to drill into that branch. */
export function StackedBarChart({
  categories,
  series,
  isPercent,
  onBarClick,
}: {
  categories: string[];
  series: StackedSeries[];
  isPercent?: boolean;
  onBarClick?: (categoryIndex: number) => void;
}) {
  const fmt = (v: number) =>
    isPercent ? `${v.toFixed(0)}%` : formatInr(v, { compact: true });
  return (
    <Chart
      height={300}
      option={{
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          valueFormatter: (v) => fmt(Number(v)),
        },
        legend: { data: series.map((s) => s.name), top: 0, textStyle: { fontSize: 11 } },
        grid: { left: 60, right: 20, top: 36, bottom: 50 },
        xAxis: {
          type: "category",
          data: categories,
          axisLabel: { rotate: categories.length > 6 ? 30 : 0 },
        },
        yAxis: {
          type: "value",
          max: isPercent ? 100 : undefined,
          axisLabel: { formatter: (v: number) => fmt(v) },
        },
        series: series.map((s) => ({
          name: s.name,
          type: "bar",
          stack: "total",
          itemStyle: { color: s.color },
          data: s.data,
        })),
      }}
      onClick={(params) => {
        const p = params as { dataIndex?: number };
        if (typeof p.dataIndex === "number" && onBarClick) onBarClick(p.dataIndex);
      }}
    />
  );
}
