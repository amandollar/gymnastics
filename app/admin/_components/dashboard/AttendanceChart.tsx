"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import ChartBox from "@/app/admin/_components/charts/ChartBox";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import type { DashboardData } from "@/lib/services/dashboard";

interface AttendanceChartProps {
  dashboardData: DashboardData;
  chartH: number;
  chartMargin: any;
  chartTooltipStyle: any;
  currentMonthLabel: string;
  currentYear: number;
  isMobile: boolean;
}

export default function AttendanceChart({
  dashboardData,
  chartH,
  chartMargin,
  chartTooltipStyle,
  currentMonthLabel,
  currentYear,
  isMobile,
}: AttendanceChartProps) {
  const [attendanceView, setAttendanceView] = useState<"daily" | "monthly">("daily");
  const [attendanceStartIndex, setAttendanceStartIndex] = useState(20);

  const attendanceChartData = useMemo(() => {
    if (attendanceView === "daily") {
      return dashboardData.attendanceDaily.map((d) => ({
        label: d.day.replace(/^0/, ""), // "05" -> "5"
        present: d.present,
      }));
    } else {
      return dashboardData.attendanceMonthly.map((d) => ({
        label: d.month,
        present: d.present,
      }));
    }
  }, [attendanceView, dashboardData]);

  const visibleAttendanceData = useMemo(() => {
    if (attendanceView === "daily") {
      return attendanceChartData.slice(
        attendanceStartIndex,
        attendanceStartIndex + 10,
      );
    }
    return attendanceChartData;
  }, [attendanceChartData, attendanceView, attendanceStartIndex]);

  return (
    <div className="rounded-3xl border-0 bg-white dark:bg-zinc-900 p-5 shadow-xs min-w-0 overflow-hidden transition-all duration-300">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-zinc-955 dark:text-zinc-50 uppercase tracking-wider truncate">
            {attendanceView === "daily"
              ? `Attendance ${currentMonthLabel}`
              : `Attendance ${currentYear}`}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setAttendanceStartIndex(Math.max(0, attendanceStartIndex - 10))}
              disabled={attendanceView === "monthly" || attendanceStartIndex === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setAttendanceStartIndex(Math.min(20, attendanceStartIndex + 10))}
              disabled={attendanceView === "monthly" || attendanceStartIndex === 20}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
          <button
            onClick={() => {
              const nextVal = attendanceView === "daily" ? "monthly" : "daily";
              setAttendanceView(nextVal);
              if (nextVal === "daily") {
                setAttendanceStartIndex(20);
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0"
          >
            {attendanceView === "daily" ? (
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
          <BarChart data={visibleAttendanceData} margin={chartMargin} barCategoryGap={6}>
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
              domain={["auto", "auto"]}
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
              cursor={{ fill: "var(--chart-cursor-bg)" }}
              separator=""
              formatter={(value) => [`${value} present`, ""]}
            />
            <Bar
              dataKey="present"
              fill="#f16d28"
              radius={[9999, 9999, 8, 8]}
              maxBarSize={isMobile ? 28 : 42}
            />
          </BarChart>
        </ChartBox>
      </div>
    </div>
  );
}
