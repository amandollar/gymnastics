"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import ChartBox from "@/app/admin/_components/charts/ChartBox";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import type { DashboardData } from "@/lib/services/dashboard";

interface AdmissionsChartProps {
  dashboardData: DashboardData;
  chartH: number;
  chartMargin: any;
  chartTooltipStyle: any;
  currentMonthLabel: string;
  currentYear: number;
  isMobile: boolean;
}

export default function AdmissionsChart({
  dashboardData,
  chartH,
  chartMargin,
  chartTooltipStyle,
  currentMonthLabel,
  currentYear,
  isMobile,
}: AdmissionsChartProps) {
  const [admissionsView, setAdmissionsView] = useState<"daily" | "monthly">("monthly");
  const [admissionsStartIndex, setAdmissionsStartIndex] = useState(20);

  const admissionsChartData = useMemo(() => {
    if (admissionsView === "daily") {
      return dashboardData.admissionsDaily.map((d) => ({
        label: d.day.replace(/^0/, ""), // "05" -> "5"
        admissions: d.admissions,
      }));
    } else {
      return dashboardData.admissionsMonthly.map((d) => ({
        label: d.month,
        admissions: d.admissions,
      }));
    }
  }, [admissionsView, dashboardData]);

  const visibleAdmissionsData = useMemo(() => {
    if (admissionsView === "daily") {
      return admissionsChartData.slice(
        admissionsStartIndex,
        admissionsStartIndex + 10,
      );
    }
    return admissionsChartData;
  }, [admissionsChartData, admissionsView, admissionsStartIndex]);

  return (
    <div className="rounded-3xl border-0 bg-white dark:bg-zinc-900 p-5 shadow-xs min-w-0 overflow-hidden transition-all duration-300">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-zinc-955 dark:text-zinc-50 uppercase tracking-wider truncate">
            {admissionsView === "daily"
              ? `Admissions ${currentMonthLabel}`
              : `Admissions ${currentYear}`}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setAdmissionsStartIndex(Math.max(0, admissionsStartIndex - 10))}
              disabled={admissionsView === "monthly" || admissionsStartIndex === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setAdmissionsStartIndex(Math.min(20, admissionsStartIndex + 10))}
              disabled={admissionsView === "monthly" || admissionsStartIndex === 20}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
          <button
            onClick={() => {
              const nextVal = admissionsView === "daily" ? "monthly" : "daily";
              setAdmissionsView(nextVal);
              if (nextVal === "daily") {
                setAdmissionsStartIndex(20);
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0"
          >
            {admissionsView === "daily" ? (
              <>
                <span>Daily View</span>
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} />
              </>
            ) : (
              <>
                <span>Monthly View</span>
                <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </div>
      <div className="mt-4">
        <ChartBox height={chartH}>
          <LineChart data={visibleAdmissionsData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{
                fontSize: isMobile ? 10 : 11,
                fill: "var(--tick-color)",
                fontWeight: 500,
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              width={isMobile ? 36 : 48}
              tick={{
                fontSize: isMobile ? 10 : 11,
                fill: "var(--tick-color)",
                fontWeight: 500,
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              separator=""
              formatter={(value) => [`${value} admissions`, ""]}
            />
            <Line
              type="monotone"
              dataKey="admissions"
              stroke="#f16d28"
              strokeWidth={3}
              dot={false}
              activeDot={{
                fill: "#f16d28",
                r: 6,
                stroke: "var(--background)",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ChartBox>
      </div>
    </div>
  );
}
