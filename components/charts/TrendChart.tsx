"use client";

import { Chart } from "@/components/charts/Chart";
import { formatInr } from "@/lib/calc/format";
import { hiyyaColors } from "@/lib/theme/tokens";

export interface TrendPoint {
  label: string;
  netSales: number;
  actualFoodCost: number;
  netProfit: number;
}

/** Sales / expenses / profit trend (Section 8) — line for sales & expenses, bar for profit. */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  return (
    <Chart
      height={320}
      option={{
        tooltip: { trigger: "axis", valueFormatter: (v) => formatInr(Number(v)) },
        legend: { data: ["Sales", "Expenses", "Profit"], top: 0 },
        grid: { left: 60, right: 20, top: 36, bottom: 30 },
        xAxis: { type: "category", data: points.map((p) => p.label) },
        yAxis: {
          type: "value",
          axisLabel: { formatter: (v: number) => formatInr(v, { compact: true }) },
        },
        series: [
          {
            name: "Sales",
            type: "line",
            smooth: true,
            data: points.map((p) => p.netSales),
            itemStyle: { color: hiyyaColors.gold },
            lineStyle: { width: 2.5 },
          },
          {
            name: "Expenses",
            type: "line",
            smooth: true,
            data: points.map((p) => p.actualFoodCost),
            itemStyle: { color: hiyyaColors.bronze },
            lineStyle: { width: 2 },
          },
          {
            name: "Profit",
            type: "bar",
            data: points.map((p) => p.netProfit),
            itemStyle: {
              color: hiyyaColors.champagne,
              opacity: 0.65,
              borderRadius: [3, 3, 0, 0],
            },
          },
        ],
      }}
    />
  );
}
