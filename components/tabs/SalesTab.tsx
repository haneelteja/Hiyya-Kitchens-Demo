"use client";

import { useEffect, useMemo, useState } from "react";
import { useDataSource } from "@/hooks/useDataSource";
import { useAccessibleScope } from "@/hooks/useAccessibleScope";
import { KpiCard } from "@/components/kpi/KpiCard";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { Chart } from "@/components/charts/Chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInr } from "@/lib/calc/format";
import { averagePerDay, bestDay } from "@/lib/calc/sales";
import { branchColors, goldRamp, hiyyaColors } from "@/lib/theme/tokens";
import type { BranchDaySales, ChannelShareRow, TopItemRow } from "@/lib/data/DataSource";
import type { Scope } from "@/lib/data/types";
import { dataset } from "@/lib/data/mock/dataset";

const PERIOD = "2026-08";

export function SalesTab() {
  const ds = useDataSource();
  const { scope } = useAccessibleScope();

  const [daily, setDaily] = useState<BranchDaySales[]>([]);
  const [topItems, setTopItems] = useState<TopItemRow[]>([]);
  const [sortBy, setSortBy] = useState<"sales" | "qty">("sales");
  const [channelMix, setChannelMix] = useState<ChannelShareRow[]>([]);
  const [onlineShare, setOnlineShare] = useState(0);

  useEffect(() => {
    let cancelled = false;
    ds.getDailySalesByBranch(scope, PERIOD).then((d) => !cancelled && setDaily(d));
    ds.getChannelMix(scope, PERIOD).then((c) => {
      if (cancelled) return;
      setChannelMix(c);
      setOnlineShare(
        c.filter((x) => x.channel !== "Dine-in").reduce((s, x) => s + x.pct, 0),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [ds, scope]);

  useEffect(() => {
    let cancelled = false;
    ds.getTopItems(scope, PERIOD, sortBy).then((r) => !cancelled && setTopItems(r));
    return () => {
      cancelled = true;
    };
  }, [ds, scope, sortBy]);

  const byDate = useMemo(() => {
    const dates = [...new Set(daily.map((d) => d.date))].sort();
    const branchCodes = [...new Set(daily.map((d) => d.branchCode))];
    return { dates, branchCodes };
  }, [daily]);

  const combinedTotal = daily.reduce((s, d) => s + d.netSales, 0);
  const combinedDaily = byDate.dates.map((date) => ({
    date,
    netSales: daily.filter((d) => d.date === date).reduce((s, d) => s + d.netSales, 0),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Net sales" value={formatInr(combinedTotal, { compact: true })} />
        <KpiCard
          label="Average per day"
          value={formatInr(averagePerDay(combinedDaily), { compact: true })}
        />
        <KpiCard
          label="Best day"
          value={
            bestDay(combinedDaily)
              ? new Date(bestDay(combinedDaily)!.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })
              : "—"
          }
          foot={
            bestDay(combinedDaily)
              ? formatInr(bestDay(combinedDaily)!.netSales, { compact: true })
              : undefined
          }
        />
        <KpiCard
          label="Online share"
          value={`${onlineShare.toFixed(0)}%`}
          foot="Swiggy + Zomato"
        />
      </div>

      <ChartFrame
        title="Daily sales, by branch"
        subtitle="August 2026 daily net sales, stacked by branch."
        accessibleTable={
          <table className="w-full text-left text-xs">
            <thead>
              <tr>
                <th>Date</th>
                {byDate.branchCodes.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byDate.dates.map((date) => (
                <tr key={date}>
                  <td>{date}</td>
                  {byDate.branchCodes.map((c) => (
                    <td key={c}>
                      {formatInr(
                        daily.find((d) => d.date === date && d.branchCode === c)
                          ?.netSales ?? 0,
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        }
      >
        <StackedBarChart
          categories={byDate.dates.map((d) => d.slice(-2))}
          series={byDate.branchCodes.map((c) => ({
            name:
              dataset.branches.find((b) => b.code === c)?.name.replace(" Mandi", "") ?? c,
            color: branchColors[c] ?? "#D4AF37",
            data: byDate.dates.map(
              (date) =>
                daily.find((d) => d.date === date && d.branchCode === c)?.netSales ?? 0,
            ),
          }))}
        />
      </ChartFrame>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartFrame
          title="Weekday pattern"
          subtitle="Average net sales by day of week."
          accessibleTable={<WeekdayTable scope={scope} />}
        >
          <WeekdayChart scope={scope} />
        </ChartFrame>

        <ChartFrame
          title="Channel mix"
          subtitle="Share of net sales by channel."
          accessibleTable={
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {channelMix.map((c) => (
                  <tr key={c.channel}>
                    <td>{c.channel}</td>
                    <td>{c.pct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <DonutChart
            slices={channelMix.map((c, i) => ({
              name: c.channel,
              value: c.pct,
              color: goldRamp[i],
              key: c.channel,
            }))}
            valueIsPercent
          />
        </ChartFrame>
      </div>

      <div className="rounded-xl border border-hiyya-panel-2 bg-hiyya-panel-2/30 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-base font-semibold text-hiyya-champagne">
              Top items
            </h2>
            <p className="text-xs text-hiyya-muted">
              SOP food cost % shown in red above 45%.
            </p>
          </div>
          <div className="flex overflow-hidden rounded-lg border border-hiyya-panel-2">
            {(["sales", "qty"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                aria-pressed={sortBy === s}
                className={`px-3 py-1.5 text-xs font-bold capitalize ${sortBy === s ? "bg-gradient-to-br from-hiyya-champagne to-hiyya-gold text-black" : "bg-hiyya-panel-2 text-hiyya-muted"}`}
              >
                By {s}
              </button>
            ))}
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-hiyya-panel-2 hover:bg-transparent">
              <TableHead className="text-hiyya-muted">Item</TableHead>
              <TableHead className="text-hiyya-muted">Category</TableHead>
              <TableHead className="text-right text-hiyya-muted">Est. qty</TableHead>
              <TableHead className="text-right text-hiyya-muted">Est. sales</TableHead>
              <TableHead className="text-right text-hiyya-muted">
                SOP food cost %
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topItems.map((item) => (
              <TableRow key={item.code} className="border-hiyya-panel-2">
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-hiyya-muted">{item.category}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.estQty.toLocaleString("en-IN")}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatInr(item.estSales, { compact: true })}
                </TableCell>
                <TableCell
                  className={`text-right tabular-nums ${item.sopFoodCostPct > 45 ? "font-bold text-hiyya-loss" : ""}`}
                >
                  {item.sopFoodCostPct.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function useWeekday(scope: Scope) {
  const ds = useDataSource();
  const [data, setData] = useState<{ day: string; average: number }[]>([]);
  useEffect(() => {
    let cancelled = false;
    ds.getWeekdayAverages(scope, PERIOD).then((r) => !cancelled && setData(r));
    return () => {
      cancelled = true;
    };
  }, [ds, scope]);
  return data;
}

function WeekdayChart({ scope }: { scope: Scope }) {
  const data = useWeekday(scope);
  return (
    <Chart
      height={220}
      option={{
        tooltip: { valueFormatter: (v) => formatInr(Number(v)) },
        grid: { left: 60, right: 16, top: 10, bottom: 26 },
        xAxis: { type: "category", data: data.map((d) => d.day) },
        yAxis: {
          type: "value",
          axisLabel: { formatter: (v: number) => formatInr(v, { compact: true }) },
        },
        series: [
          {
            type: "bar",
            data: data.map((d, i) => ({
              value: Math.round(d.average),
              itemStyle: {
                color: i === 5 || i === 6 ? hiyyaColors.champagne : hiyyaColors.deepGold,
                borderRadius: [3, 3, 0, 0],
              },
            })),
          },
        ],
      }}
    />
  );
}

function WeekdayTable({ scope }: { scope: Scope }) {
  const data = useWeekday(scope);
  return (
    <table className="w-full text-left text-xs">
      <thead>
        <tr>
          <th>Day</th>
          <th>Average</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d) => (
          <tr key={d.day}>
            <td>{d.day}</td>
            <td>{formatInr(d.average)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
