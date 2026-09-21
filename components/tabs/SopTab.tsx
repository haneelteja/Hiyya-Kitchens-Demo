"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import { useDataSource } from "@/hooks/useDataSource";
import { useAccessibleScope } from "@/hooks/useAccessibleScope";
import { useAppStore } from "@/lib/store/useAppStore";
import { KpiCard } from "@/components/kpi/KpiCard";
import { LeakCard } from "@/components/kpi/LeakCard";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { HeatmapChart } from "@/components/charts/HeatmapChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { Chart } from "@/components/charts/Chart";
import { IngredientVarianceTable } from "@/components/tables/IngredientVarianceTable";
import { formatInr, shortBranchName } from "@/lib/calc/format";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { IngredientVarianceRow, WastageReasonRow } from "@/lib/data/DataSource";
import { dataset } from "@/lib/data/mock/dataset";

const PERIOD = "2026-08";

function branchDisplayName(code: string): string {
  const name = dataset.branches.find((b) => b.code === code)?.name;
  return name ? shortBranchName(name) : code;
}

export function SopTab() {
  const ds = useDataSource();
  const { scope } = useAccessibleScope();
  const openIngredientDrilldown = useAppStore((s) => s.openIngredientDrilldown);
  const { goldRamp, hiyyaColors } = useThemeColors();

  const [rows, setRows] = useState<IngredientVarianceRow[]>([]);
  const [reasons, setReasons] = useState<WastageReasonRow[]>([]);
  const [ingredientFilter, setIngredientFilter] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ds.getIngredientVariance(scope, PERIOD).then((r) => !cancelled && setRows(r));
    ds.getWastageByReason(scope, PERIOD).then((r) => !cancelled && setReasons(r));
    return () => {
      cancelled = true;
    };
  }, [ds, scope]);

  const branches = useMemo(() => [...new Set(rows.map((r) => r.branchCode))], [rows]);
  const ingredients = useMemo(
    () => [...new Set(rows.map((r) => r.ingredientName))],
    [rows],
  );
  const showBranch = branches.length > 1;
  const branchNames = useMemo(() => branches.map(branchDisplayName), [branches]);

  const sopValue = rows.reduce(
    (s, r) =>
      s +
      r.sopUsageQty *
        (dataset.ingredients.find((i) => i.key === r.ingredientKey)?.standardRate ?? 0),
    0,
  );
  const actualValue = rows.reduce(
    (s, r) =>
      s +
      r.actualUsageQty *
        (dataset.ingredients.find((i) => i.key === r.ingredientKey)?.standardRate ?? 0),
    0,
  );
  const wastageValue = rows.reduce((s, r) => s + r.wastageValue, 0);
  const unexplainedValue = rows.reduce((s, r) => s + Math.max(0, r.unexplainedValue), 0);
  const investigateCount = rows.filter((r) => r.flag === "investigate").length;

  const heatmapValues: [number, number, number][] = [];
  branches.forEach((b, bi) => {
    ingredients.forEach((ingName, ii) => {
      const row = rows.find((r) => r.branchCode === b && r.ingredientName === ingName);
      if (row) heatmapValues.push([ii, bi, +row.deviationPct.toFixed(1)]);
    });
  });

  const leaks = useMemo(
    () => [...rows].sort((a, b) => b.unexplainedValue - a.unexplainedValue).slice(0, 6),
    [rows],
  );
  const leaksChartOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { valueFormatter: (v) => formatInr(Number(v)) },
      grid: { left: 140, right: 30, top: 10, bottom: 20 },
      xAxis: {
        type: "value",
        axisLabel: { formatter: (v: number) => formatInr(v, { compact: true }) },
      },
      yAxis: {
        type: "category",
        data: leaks.map(
          (r) => r.ingredientName + (showBranch ? ` · ${branchDisplayName(r.branchCode)}` : ""),
        ),
      },
      series: [
        {
          type: "bar",
          data: leaks.map((r) => ({
            value: r.unexplainedValue,
            itemStyle: {
              color: r.flag === "investigate" ? hiyyaColors.loss : hiyyaColors.warning,
              borderRadius: [0, 4, 4, 0],
            },
          })),
        },
      ],
    }),
    [leaks, showBranch, hiyyaColors],
  );

  const filteredRows = ingredientFilter
    ? rows.filter((r) => r.ingredientName === ingredientFilter)
    : rows;

  const drillIngredient = useCallback(
    (ingredientName: string) => {
      const row = rows.find((r) => r.ingredientName === ingredientName);
      if (!row) return;
      openIngredientDrilldown(row.ingredientKey, ingredientName, branches);
    },
    [rows, branches, openIngredientDrilldown],
  );
  // Stable reference so IngredientVarianceTable's memoized rows don't
  // re-render on every SopTab render (perf review, Section 2, P1).
  const handleVarianceRowClick = useCallback(
    (_ingredientKey: string, name: string) => drillIngredient(name),
    [drillIngredient],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="SOP value" value={formatInr(sopValue, { compact: true })} />
        <KpiCard label="Actual value" value={formatInr(actualValue, { compact: true })} />
        <KpiCard
          label="Logged wastage"
          value={formatInr(wastageValue, { compact: true })}
        />
        <LeakCard
          label="Unexplained deviation"
          value={formatInr(unexplainedValue, { compact: true })}
          foot={`${investigateCount} ingredient(s) flagged Investigate`}
        />
      </div>

      <ChartFrame
        title="Deviation heatmap"
        subtitle="Branch × ingredient deviation %. Click a cell to filter the table below."
        accessibleTable={
          <table className="w-full text-left text-xs">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Ingredient</th>
                <th>Deviation %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{branchDisplayName(r.branchCode)}</td>
                  <td>{r.ingredientName}</td>
                  <td>{r.deviationPct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      >
        <HeatmapChart
          branches={branchNames}
          ingredients={ingredients}
          values={heatmapValues}
          onCellClick={(ingredientName) => {
            setIngredientFilter(ingredientName);
            drillIngredient(ingredientName);
          }}
        />
      </ChartFrame>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartFrame
          title="Biggest leaks, by value"
          subtitle="The six ingredient × branch lines losing the most money."
          accessibleTable={
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {leaks.map((r, i) => (
                  <tr key={i}>
                    <td>
                      {r.ingredientName}
                      {showBranch ? ` · ${branchDisplayName(r.branchCode)}` : ""}
                    </td>
                    <td>{formatInr(r.unexplainedValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <Chart height={220} option={leaksChartOption} />
        </ChartFrame>

        <ChartFrame
          title="Wastage by reason"
          subtitle="Logged wastage value, split by reason code."
          accessibleTable={
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th>Reason</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {reasons.map((r) => (
                  <tr key={r.reason}>
                    <td>{r.reason}</td>
                    <td>{formatInr(r.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <DonutChart
            slices={reasons.map((r, i) => ({
              name: r.reason,
              value: r.value,
              color: goldRamp[i % goldRamp.length],
            }))}
          />
        </ChartFrame>
      </div>

      <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-heading text-base font-semibold text-hiyya-champagne">
              Ingredient variance
            </h2>
            <p className="text-xs text-hiyya-muted">
              Click a row to see which menu items likely drove it.
            </p>
          </div>
          {ingredientFilter && (
            <button
              onClick={() => setIngredientFilter(null)}
              className="rounded-full border border-hiyya-panel-2 px-3 py-1 text-xs text-hiyya-muted hover:text-hiyya-gold"
            >
              Clear filter: {ingredientFilter} ✕
            </button>
          )}
        </div>
        <IngredientVarianceTable
          rows={filteredRows}
          showBranch={showBranch}
          onRowClick={handleVarianceRowClick}
        />
      </div>
    </div>
  );
}
