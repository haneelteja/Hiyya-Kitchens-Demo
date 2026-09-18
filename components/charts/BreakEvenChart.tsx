"use client";

import { Chart } from "@/components/charts/Chart";
import { formatInr } from "@/lib/calc/format";
import { hiyyaColors } from "@/lib/theme/tokens";

/** Gross margin bars vs. a dashed fixed-cost-per-day line — red on days below it
 * (Section 8). */
export function BreakEvenChart({
  labels,
  grossMarginByDay,
  fixedCostPerDay,
}: {
  labels: string[];
  grossMarginByDay: number[];
  fixedCostPerDay: number;
}) {
  return (
    <Chart
      height={280}
      option={{
        tooltip: { trigger: "axis", valueFormatter: (v) => formatInr(Number(v)) },
        legend: { data: ["Gross margin", "Daily fixed cost"], top: 0 },
        grid: { left: 60, right: 20, top: 36, bottom: 30 },
        xAxis: { type: "category", data: labels },
        yAxis: {
          type: "value",
          axisLabel: { formatter: (v: number) => formatInr(v, { compact: true }) },
        },
        series: [
          {
            name: "Gross margin",
            type: "bar",
            data: grossMarginByDay.map((v) => ({
              value: Math.round(v),
              itemStyle: {
                color: v >= fixedCostPerDay ? hiyyaColors.gain : hiyyaColors.loss,
                borderRadius: [3, 3, 0, 0],
              },
            })),
          },
          {
            name: "Daily fixed cost",
            type: "line",
            data: labels.map(() => Math.round(fixedCostPerDay)),
            itemStyle: { color: hiyyaColors.gold },
            lineStyle: { width: 2, type: "dashed" },
            symbol: "none",
          },
        ],
      }}
    />
  );
}
