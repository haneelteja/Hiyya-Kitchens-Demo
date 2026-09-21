"use client";

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { Chart } from "@/components/charts/Chart";
import { formatInr } from "@/lib/calc/format";
import { useThemeColors } from "@/hooks/useThemeColors";

export interface DonutSlice {
  name: string;
  value: number;
  color?: string;
  key?: string;
}

/** Revenue-contribution / channel-mix / wastage-by-reason donut. Click a slice to
 * drill in (Section 8). */
export function DonutChart({
  slices,
  valueIsPercent,
  onSliceClick,
}: {
  slices: DonutSlice[];
  valueIsPercent?: boolean;
  onSliceClick?: (key: string) => void;
}) {
  const { goldRamp } = useThemeColors();
  const option = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        formatter: (p: unknown) => {
          const point = p as { name: string; value: number; percent: number };
          const val = valueIsPercent
            ? `${point.value.toFixed(1)}%`
            : formatInr(point.value);
          return `${point.name}: ${val}`;
        },
      },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      series: [
        {
          type: "pie",
          radius: ["45%", "72%"],
          avoidLabelOverlap: true,
          label: { formatter: "{d}%" },
          data: slices.map((s, i) => ({
            name: s.name,
            value: s.value,
            key: s.key ?? s.name,
            itemStyle: { color: s.color ?? goldRamp[i % goldRamp.length] },
          })),
        },
      ],
    }),
    [slices, valueIsPercent, goldRamp],
  );

  return (
    <Chart
      height={260}
      option={option}
      onClick={(params) => {
        const data = (params as { data?: { key?: string } }).data;
        if (data?.key && onSliceClick) onSliceClick(data.key);
      }}
    />
  );
}
