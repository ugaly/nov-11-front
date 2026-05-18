"use client";

import type { CategorySeries } from "@/lib/dashboard-chart-types";
import { Layers } from "lucide-react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type ChartView = "daily" | "monthly";

const CHART_COLORS = ["#111111", "#404040", "#737373", "#a3a3a3", "#d4d4d4"];

export default function CategoryPerformanceChart({
  data,
  periodLabel,
  isSample = false,
}: {
  data: CategorySeries;
  periodLabel: string;
  isSample?: boolean;
}) {
  const [view, setView] = useState<ChartView>("daily");

  const chartData = view === "daily" ? data.daily : data.monthly;
  const hasData = chartData.series.some((s) => s.data.some((n) => n > 0));

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "bar",
        toolbar: { show: false },
        stacked: false,
      },
      colors: CHART_COLORS,
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: view === "daily" ? "62%" : "48%",
          borderRadius: 4,
          borderRadiusApplication: "end",
        },
      },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 1, colors: ["transparent"] },
      xaxis: {
        categories: chartData.labels,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: "#64748b", fontSize: "11px" } },
      },
      yaxis: {
        labels: {
          style: { colors: "#64748b", fontSize: "11px" },
          formatter: (v) => String(Math.round(Number(v))),
        },
        tickAmount: 4,
      },
      grid: {
        borderColor: "#e5e7eb",
        strokeDashArray: 4,
        yaxis: { lines: { show: true } },
      },
      legend: {
        position: "top",
        horizontalAlign: "left",
        fontSize: "12px",
      },
      tooltip: {
        theme: "light",
        y: { formatter: (v) => `${v} engagement${v === 1 ? "" : "s"}` },
      },
    }),
    [chartData.labels, view]
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white">
            <Layers className="size-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Category performance
            </h3>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Service engagements by category · {periodLabel.toLowerCase()}
              {isSample ? (
                <span className="text-gray-400 dark:text-gray-500">
                  {" "}
                  · sample data
                </span>
              ) : null}
            </p>
          </div>
        </div>
        <div
          className="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700"
          role="tablist"
          aria-label="Chart range"
        >
          {(
            [
              { id: "daily" as const, label: "Daily" },
              { id: "monthly" as const, label: "Monthly" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={view === tab.id}
              onClick={() => setView(tab.id)}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                view === tab.id
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <div className="min-h-[280px]">
          <ReactApexChart
            options={options}
            series={chartData.series}
            type="bar"
            height={280}
          />
        </div>
      ) : (
        <p className="py-16 text-center text-sm text-gray-500">
          No engagements in this period to compare categories.
        </p>
      )}
    </div>
  );
}
