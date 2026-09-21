"use client";

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { Chart } from "@/components/charts/Chart";
import { useThemeColors } from "@/hooks/useThemeColors";

/** Deviation heatmap: branch × ingredient. Clicking a cell filters the ingredient
 * table (Section 8). */
export function HeatmapChart({
  branches,
  ingredients,
  values, // [ingredientIndex, branchIndex, value]
  onCellClick,
}: {
  branches: string[];
  ingredients: string[];
  values: [number, number, number][];
  onCellClick?: (ingredient: string, branch: string) => void;
}) {
  const { hiyyaColors } = useThemeColors();
  const option = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        formatter: (p: unknown) => {
          const point = p as { data: [number, number, number] };
          return `${ingredients[point.data[0]]} · ${branches[point.data[1]]}: ${point.data[2]}%`;
        },
      },
      grid: { left: 130, right: 20, top: 10, bottom: 60 },
      xAxis: { type: "category", data: ingredients, axisLabel: { rotate: 35 } },
      yAxis: { type: "category", data: branches },
      visualMap: {
        min: -10,
        max: 20,
        show: false,
        // Diverging scale: gain-green (under SOP) -> panel (roughly on SOP) ->
        // deep-gold -> loss-coral (well over SOP). The neutral stop uses the
        // theme's own panel color so a near-zero cell blends into the page.
        inRange: {
          color: [
            hiyyaColors.gain,
            hiyyaColors.panel2,
            hiyyaColors.deepGold,
            hiyyaColors.loss,
          ],
        },
      },
      series: [
        {
          type: "heatmap",
          data: values,
          label: {
            show: true,
            color: hiyyaColors.text,
            fontSize: 10,
            formatter: (p: unknown) =>
              `${(p as { data: [number, number, number] }).data[2]}%`,
          },
        },
      ],
    }),
    [branches, ingredients, values, hiyyaColors],
  );

  return (
    <Chart
      height={Math.max(180, branches.length * 46 + 60)}
      option={option}
      onClick={(params) => {
        const p = params as { data?: [number, number, number] };
        if (p.data && onCellClick)
          onCellClick(ingredients[p.data[0]], branches[p.data[1]]);
      }}
    />
  );
}
