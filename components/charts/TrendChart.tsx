"use client";

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { Chart } from "@/components/charts/Chart";
import { formatInr } from "@/lib/calc/format";
import { hiyyaColors } from "@/lib/theme/tokens";

export interface TrendPoint {
  label: string;
  netSales: number;
  actualFoodCost: number;
  netProfit: number;
}

export interface BranchTrendSeries {
  code: string;
  name: string;
  color: string;
  points: TrendPoint[];
}

interface TooltipParam {
  seriesName: string;
  marker: string;
  value: number;
  dataIndex: number;
}

/** Sales / expenses / profit trend (Section 8) — line for sales & expenses, bar for
 * profit. In the brand-wide "combined" view, hovering also breaks the sales and
 * expenses down by branch (branches is only passed when there's more than one
 * branch in scope). Switching to "branch" view swaps the combined lines for one
 * sales/expenses pair per branch, each in that branch's own color. */
export function TrendChart({
  points,
  branches,
  view = "combined",
}: {
  points: TrendPoint[];
  branches?: BranchTrendSeries[];
  view?: "combined" | "branch";
}) {
  const option = useMemo<EChartsOption>(() => {
    if (view === "branch" && branches && branches.length > 0) {
      const series: NonNullable<EChartsOption["series"]> = [];
      branches.forEach((b) => {
        series.push({
          name: `${b.name} · sales`,
          type: "line",
          smooth: true,
          data: b.points.map((p) => p.netSales),
          itemStyle: { color: b.color },
          lineStyle: { width: 2.5, color: b.color },
          symbolSize: 5,
        });
        series.push({
          name: `${b.name} · expenses`,
          type: "line",
          smooth: true,
          data: b.points.map((p) => p.actualFoodCost),
          itemStyle: { color: b.color },
          lineStyle: { width: 1.5, type: "dashed", color: b.color },
          symbol: "none",
        });
      });

      return {
        tooltip: {
          trigger: "axis",
          // Chart.tsx sets notMerge:false for cheaper re-renders, which deep-merges
          // tooltip config between option changes — an explicit formatter here (not
          // just valueFormatter) is required so switching from the "combined" view's
          // custom formatter doesn't leave it merged in and double-rendering.
          formatter: (paramsRaw: unknown) => {
            const params = paramsRaw as TooltipParam[];
            const idx = params[0]?.dataIndex ?? 0;
            const lines = [`<strong>${points[idx]?.label ?? ""}</strong>`];
            params.forEach((p) => {
              lines.push(`${p.marker} ${p.seriesName}: ${formatInr(Number(p.value))}`);
            });
            return lines.join("<br/>");
          },
        },
        legend: {
          data: series.map((s) => s.name as string),
          top: 0,
          textStyle: { fontSize: 10 },
        },
        grid: { left: 60, right: 20, top: 44, bottom: 30 },
        xAxis: { type: "category", data: points.map((p) => p.label) },
        yAxis: {
          type: "value",
          axisLabel: { formatter: (v: number) => formatInr(v, { compact: true }) },
        },
        series,
      };
    }

    return {
      tooltip: {
        trigger: "axis",
        formatter: (paramsRaw: unknown) => {
          const params = paramsRaw as TooltipParam[];
          const idx = params[0]?.dataIndex ?? 0;
          const lines = [`<strong>${points[idx]?.label ?? ""}</strong>`];
          params.forEach((p) => {
            lines.push(`${p.marker} ${p.seriesName}: ${formatInr(Number(p.value))}`);
          });
          if (branches && branches.length > 0) {
            lines.push(
              '<div style="margin:4px 0 2px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.15);font-weight:600;">By branch</div>',
            );
            branches.forEach((b) => {
              const bp = b.points[idx];
              if (!bp) return;
              lines.push(
                `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${b.color};margin-right:5px;"></span>` +
                  `${b.name}: ${formatInr(bp.netSales, { compact: true })} sales · ${formatInr(bp.actualFoodCost, { compact: true })} exp`,
              );
            });
          }
          return lines.join("<br/>");
        },
      },
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
    };
  }, [points, branches, view]);

  return <Chart height={320} option={option} notMerge />;
}
