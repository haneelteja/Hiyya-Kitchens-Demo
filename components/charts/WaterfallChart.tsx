"use client";

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { Chart } from "@/components/charts/Chart";
import { formatInr } from "@/lib/calc/format";
import { useThemeColors } from "@/hooks/useThemeColors";

export interface WaterfallStep {
  label: string;
  value: number; // negative = a cost step, positive = the closing total
  isTotal?: boolean;
}

/** Sales → food cost at SOP → wastage & deviation → commission → fixed → royalty &
 * fund → net profit (Section 8). */
export function WaterfallChart({ steps }: { steps: WaterfallStep[] }) {
  const { hiyyaColors } = useThemeColors();
  const option = useMemo<EChartsOption>(() => {
    let running = 0;
    const base: number[] = [];
    const pos: number[] = [];
    const neg: number[] = [];
    const total: number[] = [];

    steps.forEach((s) => {
      if (s.isTotal) {
        base.push(0);
        pos.push(0);
        neg.push(0);
        total.push(s.value);
        return;
      }
      const start = s.value >= 0 ? running : running + s.value;
      base.push(start);
      pos.push(s.value >= 0 ? s.value : 0);
      neg.push(s.value < 0 ? -s.value : 0);
      total.push(0);
      running += s.value;
    });

    return {
      tooltip: {
        formatter: (params: unknown) => {
          const arr = params as Array<{ dataIndex: number }>;
          const s = steps[arr[0].dataIndex];
          return `${s.label}: ${formatInr(Math.abs(s.value))}`;
        },
      },
      grid: { left: 60, right: 20, top: 10, bottom: 70 },
      xAxis: {
        type: "category",
        data: steps.map((s) => s.label),
        axisLabel: { rotate: 28 },
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: (v: number) => formatInr(v, { compact: true }) },
      },
      series: [
        {
          name: "base",
          type: "bar",
          stack: "wf",
          itemStyle: { color: "transparent" },
          data: base,
          silent: true,
        },
        {
          name: "increase",
          type: "bar",
          stack: "wf",
          itemStyle: { color: hiyyaColors.gain },
          data: pos,
        },
        {
          name: "decrease",
          type: "bar",
          stack: "wf",
          itemStyle: { color: hiyyaColors.loss },
          data: neg,
        },
        {
          name: "total",
          type: "bar",
          stack: "wf",
          itemStyle: { color: hiyyaColors.gold },
          data: total,
        },
      ],
    };
  }, [steps, hiyyaColors]);

  return <Chart height={320} option={option} />;
}
