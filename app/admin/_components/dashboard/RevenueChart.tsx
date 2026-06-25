"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import ChartBox from "@/app/admin/_components/charts/ChartBox";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import type { DashboardData } from "@/lib/services/dashboard";
import { getRevenueChartDataAction } from "@/lib/actions/payments";

interface RevenueChartProps {
  dashboardData: DashboardData;
  chartH: number;
  chartMargin: any;
  chartTooltipStyle: any;
  isMobile: boolean;
  formatShortRevenue: (value: number) => string;
}

export default function RevenueChart({
  dashboardData,
  chartH,
  chartMargin,
  chartTooltipStyle,
  isMobile,
  formatShortRevenue,
}: RevenueChartProps) {
  const [revenueView, setRevenueView] = useState<"daily" | "monthly">("monthly");
  const [revenueDate, setRevenueDate] = useState<Date>(() => new Date());
  const [revenueData, setRevenueData] = useState<{ label: string; revenue: number }[]>(
    () => dashboardData.revenueMonthly,
  );

  const revenueChartTitle = useMemo(() => {
    if (revenueView === "daily") {
      const monthLabel = revenueDate
        .toLocaleString("en-US", { month: "short" })
        .toUpperCase();
      return `REVENUE ${monthLabel}`;
    } else {
      return `REVENUE ${revenueDate.getFullYear()}`;
    }
  }, [revenueView, revenueDate]);

  useEffect(() => {
    const now = new Date();
    const isCurrentMonth =
      revenueDate.getMonth() === now.getMonth() &&
      revenueDate.getFullYear() === now.getFullYear();
    const isCurrentYear = revenueDate.getFullYear() === now.getFullYear();

    if (revenueView === "daily" && isCurrentMonth) {
      setRevenueData(dashboardData.revenueDaily);
      return;
    }
    if (revenueView === "monthly" && isCurrentYear) {
      setRevenueData(dashboardData.revenueMonthly);
      return;
    }

    let active = true;
    const fetchRevenue = async () => {
      const res = await getRevenueChartDataAction(
        revenueView,
        revenueDate.getFullYear(),
        revenueView === "daily" ? revenueDate.getMonth() : undefined,
      );
      if (active && res.success && res.data) {
        setRevenueData(res.data);
      }
    };
    fetchRevenue();
    return () => {
      active = false;
    };
  }, [revenueView, revenueDate, dashboardData]);

  return (
    <div className="rounded-3xl border-0 bg-white dark:bg-zinc-900 p-5 shadow-xs min-w-0 overflow-hidden transition-all duration-300">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-zinc-955 dark:text-zinc-50 uppercase tracking-wider truncate">
            {revenueChartTitle}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => {
                setRevenueDate((prev) => {
                  const next = new Date(prev);
                  if (revenueView === "daily") {
                    next.setMonth(next.getMonth() - 1);
                  } else {
                    next.setFullYear(next.getFullYear() - 1);
                  }
                  return next;
                });
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => {
                setRevenueDate((prev) => {
                  const next = new Date(prev);
                  if (revenueView === "daily") {
                    next.setMonth(next.getMonth() + 1);
                  } else {
                    next.setFullYear(next.getFullYear() + 1);
                  }
                  return next;
                });
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
          <button
            onClick={() => {
              const nextVal = revenueView === "daily" ? "monthly" : "daily";
              setRevenueView(nextVal);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0"
          >
            {revenueView === "daily" ? (
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
          <LineChart data={revenueData} margin={chartMargin}>
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
              tickFormatter={(v) => `₹${formatShortRevenue(v)}`}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]}
            />
            <Line
              type="monotone"
              dataKey="revenue"
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
