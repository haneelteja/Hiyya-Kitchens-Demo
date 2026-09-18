"use client";

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { Chart } from "@/components/charts/Chart";
import { formatInr } from "@/lib/calc/format";
import { branchColors } from "@/lib/theme/tokens";

export interface RankBar {
  branchCode: string;
  label: string;
  value: number;
}

/** Horizontal branch-ranking bar chart. Click a bar to drill in (Section 8). */
export function RankChart({
  bars,
  isPercent,
  onBarClick,
}: {
  bars: RankBar[];
  isPercent?: boolean;
  onBarClick?: (branchCode: string) => void;
}) {
  const option = useMemo<EChartsOption>(() => {
    const fmt = (v: number) =>
      isPercent ? `${v.toFixed(1)}%` : formatInr(v, { compact: true });
    return {
      tooltip: {
        formatter: (p: unknown) => {
          const point = p as { name: string; value: number };
          return `${point.name}: ${fmt(point.value)}`;
        },
      },
      grid: { left: 110, right: 40, top: 10, bottom: 20 },
      xAxis: { type: "value", axisLabel: { formatter: (v: number) => fmt(v) } },
      yAxis: { type: "category", data: bars.map((b) => b.label) },
      series: [
        {
          type: "bar",
          barWidth: 20,
          data: bars.map((b) => ({
            value: b.value,
            branchCode: b.branchCode,
            itemStyle: {
              color: branchColors[b.branchCode] ?? "#D4AF37",
              borderRadius: [0, 4, 4, 0],
            },
          })),
          label: {
            show: true,
            position: "right",
            formatter: (p: unknown) => fmt((p as { value: number }).value),
          },
        },
      ],
    };
  }, [bars, isPercent]);

  return (
    <Chart
      height={220}
      option={option}
      onClick={(params) => {
        const data = (params as { data?: { branchCode?: string } }).data;
        if (data?.branchCode && onBarClick) onBarClick(data.branchCode);
      }}
    />
  );
}
