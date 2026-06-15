"use client";

import { useState, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PresentStudent, MonthlyBreakdown } from "@/lib/services/attendance";
import { fetchChartDataAction } from "@/lib/actions/attendance";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const chartTooltipStyle = {
  backgroundColor: "var(--chart-tooltip-bg)",
  border: "1px solid var(--chart-tooltip-border)",
  color: "var(--chart-tooltip-text)",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow:
    "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)",
  padding: "8px 12px",
};

interface AdmissionsRenewalsChartCardProps {
  year: number;
  month: number;
  yearlyBreakdown: (MonthlyBreakdown & { month: number })[];
  registrationsByDate?: Record<string, PresentStudent[]>;
  renewalsByDate?: Record<string, PresentStudent[]>;
}

export default function AdmissionsRenewalsChartCard({
  year: initialYear,
  month: initialMonth,
  yearlyBreakdown: initialYearlyBreakdown,
  registrationsByDate: initialRegistrationsByDate,
  renewalsByDate: initialRenewalsByDate,
}: AdmissionsRenewalsChartCardProps) {
  const [chartViewType, setChartViewType] = useState<"monthly" | "daily">("monthly");
  
  // Independent Filter States
  const [chartYear, setChartYear] = useState(initialYear);
  const [chartMonth, setChartMonth] = useState(initialMonth);
  const [localYearlyBreakdown, setLocalYearlyBreakdown] = useState(initialYearlyBreakdown);
  const [localRegistrationsByDate, setLocalRegistrationsByDate] = useState(initialRegistrationsByDate);
  const [localRenewalsByDate, setLocalRenewalsByDate] = useState(initialRenewalsByDate);
  const [loadingDir, setLoadingDir] = useState<"prev" | "next" | "general" | null>(null);
  const isLoading = loadingDir !== null;

  // Cache ref for client-side memoization (avoids hitting network for previously visited dates)
  const chartCache = useRef<Record<string, {
    yearlyBreakdown: (MonthlyBreakdown & { month: number })[];
    registrationsByDate: Record<string, PresentStudent[]>;
    renewalsByDate: Record<string, PresentStudent[]>;
  }>>({
    [`${initialYear}-${initialMonth}`]: {
      yearlyBreakdown: initialYearlyBreakdown,
      registrationsByDate: initialRegistrationsByDate || {},
      renewalsByDate: initialRenewalsByDate || {},
    }
  });

  // Derive days in month dynamically
  const daysInMonth = useMemo(() => {
    return new Date(chartYear, chartMonth, 0).getDate();
  }, [chartYear, chartMonth]);

  // Fetch helper with client-side caching support
  const fetchDataForFilters = async (y: number, m: number, dir: "prev" | "next" | "general" = "general") => {
    const cacheKey = `${y}-${m}`;
    if (chartCache.current[cacheKey]) {
      const cached = chartCache.current[cacheKey];
      setLocalYearlyBreakdown(cached.yearlyBreakdown);
      setLocalRegistrationsByDate(cached.registrationsByDate);
      setLocalRenewalsByDate(cached.renewalsByDate);
      return;
    }

    setLoadingDir(dir);
    try {
      const res = await fetchChartDataAction(y, m);
      // Store in client-side cache
      chartCache.current[cacheKey] = {
        yearlyBreakdown: res.yearlyBreakdown,
        registrationsByDate: res.registrationsByDate || {},
        renewalsByDate: res.renewalsByDate || {},
      };
      setLocalYearlyBreakdown(res.yearlyBreakdown);
      setLocalRegistrationsByDate(res.registrationsByDate);
      setLocalRenewalsByDate(res.renewalsByDate);
    } catch (error) {
      console.error("Failed to fetch chart data:", error);
    } finally {
      setLoadingDir(null);
    }
  };

  // Navigations (Independent of parent component)
  const handlePrevYear = () => {
    const newYear = chartYear - 1;
    setChartYear(newYear);
    fetchDataForFilters(newYear, chartMonth, "prev");
  };

  const handleNextYear = () => {
    const newYear = chartYear + 1;
    setChartYear(newYear);
    fetchDataForFilters(newYear, chartMonth, "next");
  };

  const handlePrevMonth = () => {
    let newMonth = chartMonth - 1;
    let newYear = chartYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear = chartYear - 1;
    }
    setChartMonth(newMonth);
    setChartYear(newYear);
    fetchDataForFilters(newYear, newMonth, "prev");
  };

  const handleNextMonth = () => {
    let newMonth = chartMonth + 1;
    let newYear = chartYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear = chartYear + 1;
    }
    setChartMonth(newMonth);
    setChartYear(newYear);
    fetchDataForFilters(newYear, newMonth, "next");
  };

  const handleViewTypeChange = (newType: "monthly" | "daily") => {
    setChartViewType(newType);
    const now = new Date();
    const curY = now.getFullYear();
    const curM = now.getMonth() + 1;
    if (chartYear !== curY || chartMonth !== curM) {
      setChartYear(curY);
      setChartMonth(curM);
      fetchDataForFilters(curY, curM, "general");
    }
  };

  // ── Monthly breakdown chart data ──────────────────────────────────────────

  const breakdownChartData = useMemo(() => {
    return localYearlyBreakdown.map((mb) => ({
      month: MONTH_NAMES[mb.month - 1].slice(0, 3),
      newAdmissions: mb.newAdmissions,
      renewals: mb.renewals,
      sessions: Math.round(mb.totalSessions / Math.max(mb.activeDays, 1)), // avg daily
    }));
  }, [localYearlyBreakdown]);

  // ── Daily breakdown chart data ────────────────────────────────────────────

  const dailyChartData = useMemo(() => {
    const data = [];
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${chartYear}-${String(chartMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const newAdmissions = localRegistrationsByDate?.[dateStr]?.length ?? 0;
      const renewals = localRenewalsByDate?.[dateStr]?.length ?? 0;
      data.push({
        day: dayNum,
        newAdmissions,
        renewals,
      });
    }
    return data;
  }, [chartYear, chartMonth, daysInMonth, localRegistrationsByDate, localRenewalsByDate]);

  // Future-date disabling helpers
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const isAtCurrentYear = chartYear >= currentYear;
  const isAtCurrentMonth = chartYear >= currentYear && chartMonth >= currentMonth;

  return (
    <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 flex flex-col justify-between w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            Admissions &amp; Renewals — {chartViewType === "monthly" ? chartYear : `${MONTH_NAMES[chartMonth - 1]} ${chartYear}`}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Year Switcher (shown in monthly view) */}
          {chartViewType === "monthly" ? (
            <div className="flex items-center gap-1 rounded-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 p-1 shadow-sm">
              <button
                onClick={handlePrevYear}
                disabled={isLoading}
                className={`flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all ${
                  isLoading ? "cursor-default opacity-40" : "cursor-pointer"
                }`}
              >
                {loadingDir === "prev" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-orange-500" />
                ) : (
                  <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
                )}
              </button>
              <span className="text-[10px] font-extrabold text-zinc-700 dark:text-zinc-300 min-w-[36px] text-center select-none tabular-nums">
                {chartYear}
              </span>
              <button
                onClick={handleNextYear}
                disabled={isLoading || isAtCurrentYear}
                className={`flex h-6 w-6 items-center justify-center rounded-full transition-all ${
                  isAtCurrentYear
                    ? "text-zinc-300 dark:text-zinc-800 cursor-default opacity-40"
                    : isLoading
                      ? "text-zinc-500 cursor-default opacity-40"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                }`}
              >
                {loadingDir === "next" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-orange-500" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                )}
              </button>
            </div>
          ) : (
            /* Month Switcher (shown in daily view) */
            <div className="flex items-center gap-1 rounded-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 p-1 shadow-sm">
              <button
                onClick={handlePrevMonth}
                disabled={isLoading}
                className={`flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all ${
                  isLoading ? "cursor-default opacity-40" : "cursor-pointer"
                }`}
              >
                {loadingDir === "prev" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-orange-500" />
                ) : (
                  <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
                )}
              </button>
              <span className="text-[10px] font-extrabold text-zinc-700 dark:text-zinc-300 min-w-[70px] text-center select-none uppercase tracking-wider">
                {MONTH_NAMES[chartMonth - 1].slice(0, 3)} {chartYear}
              </span>
              <button
                onClick={handleNextMonth}
                disabled={isLoading || isAtCurrentMonth}
                className={`flex h-6 w-6 items-center justify-center rounded-full transition-all ${
                  isAtCurrentMonth
                    ? "text-zinc-300 dark:text-zinc-800 cursor-default opacity-40"
                    : isLoading
                      ? "text-zinc-500 cursor-default opacity-40"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                }`}
              >
                {loadingDir === "next" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-orange-500" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                )}
              </button>
            </div>
          )}

          {/* View Type Dropdown */}
          <select
            value={chartViewType}
            disabled={isLoading}
            onChange={(e) => handleViewTypeChange(e.target.value as any)}
            className={`bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-2.5 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 outline-none focus:ring-1 focus:ring-brand-orange-500/20 ${
              isLoading ? "cursor-default opacity-50" : "cursor-pointer"
            }`}
          >
            <option value="monthly">Monthly View</option>
            <option value="daily">Daily View</option>
          </select>
        </div>
      </div>
      <div className={`w-full flex-1 transition-opacity duration-200 ${isLoading ? "opacity-50 pointer-events-none" : ""}`}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            key={`${chartViewType}-${chartYear}-${chartMonth}`}
            data={(chartViewType === "monthly" ? breakdownChartData : dailyChartData) as any}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            barCategoryGap={chartViewType === "monthly" ? "30%" : "20%"}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--chart-grid)"
              vertical={false}
            />
            <XAxis
              dataKey={chartViewType === "monthly" ? "month" : "day"}
              tick={{
                fontSize: 10,
                fill: "var(--tick-color)",
                fontWeight: 600,
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{
                fontSize: 10,
                fill: "var(--tick-color)",
                fontWeight: 600,
              }}
              axisLine={false}
              tickLine={false}
              width={30}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              cursor={{ fill: "rgba(241, 109, 40, 0.03)" }}
              formatter={(val, name) => [Number(val), String(name)]}
            />
            <Bar
              dataKey="newAdmissions"
              name="New Admissions"
              fill="#f16d28"
              radius={[4, 4, 0, 0]}
              maxBarSize={chartViewType === "monthly" ? 18 : 8}
              stackId="a"
            />
            <Bar
              dataKey="renewals"
              name="Renewals"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              maxBarSize={chartViewType === "monthly" ? 18 : 8}
              stackId="a"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Elegant custom legend */}
      <div className="flex items-center gap-6 mt-4 justify-center select-none">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-brand-orange-500" />
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
            New Admissions
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-violet-500" />
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
            Renewals
          </span>
        </div>
      </div>
    </div>
  );
}
