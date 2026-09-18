"use client";

import { Chart } from "@/components/charts/Chart";

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
  return (
    <Chart
      height={Math.max(180, branches.length * 46 + 60)}
      option={{
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
          inRange: { color: ["#3E7D53", "#1B1813", "#8A6C2A", "#D8674F"] },
        },
        series: [
          {
            type: "heatmap",
            data: values,
            label: {
              show: true,
              color: "#F3ECDC",
              fontSize: 10,
              formatter: (p: unknown) =>
                `${(p as { data: [number, number, number] }).data[2]}%`,
            },
          },
        ],
      }}
      onClick={(params) => {
        const p = params as { data?: [number, number, number] };
        if (p.data && onCellClick)
          onCellClick(ingredients[p.data[0]], branches[p.data[1]]);
      }}
    />
  );
}
