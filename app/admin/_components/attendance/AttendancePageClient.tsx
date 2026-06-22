"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  UserPlus,
  RefreshCw,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type {
  AttendanceKpis,
  DayAttendanceCount,
  PresentStudent,
  MonthlyBreakdown,
} from "@/lib/services/attendance";

import CalendarViewCard from "./CalendarViewCard";
import RollCallCard from "./RollCallCard";
import AdmissionsRenewalsChartCard from "./AdmissionsRenewalsChartCard";

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  kpis: AttendanceKpis;
  calendarCounts: DayAttendanceCount[];
  rollCallByDate: Record<string, PresentStudent[]>;
  registrationsByDate?: Record<string, PresentStudent[]>;
  renewalsByDate?: Record<string, PresentStudent[]>;
  yearlyBreakdown: (MonthlyBreakdown & { month: number })[];
  todayStr: string;
  year: number;
  month: number;
}

export default function AttendancePageClient({
  kpis,
  calendarCounts,
  rollCallByDate,
  registrationsByDate,
  renewalsByDate,
  yearlyBreakdown,
  todayStr,
  year,
  month,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // ── Date state synchronization ───────────────────────────────────────────

  const defaultDate = useMemo(() => {
    const today = new Date(todayStr);
    if (year === today.getFullYear() && month === today.getMonth() + 1) {
      return todayStr;
    }
    return `${year}-${String(month).padStart(2, "0")}-01`;
  }, [year, month, todayStr]);

  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [viewType, setViewType] = useState<"attendance" | "registrations" | "renewals">("attendance");

  // Derive counts based on active view type
  const calendarCountsForView = useMemo(() => {
    if (viewType === "registrations") {
      const counts: Record<string, number> = {};
      Object.entries(registrationsByDate || {}).forEach(([dateStr, list]) => {
        counts[dateStr] = list.length;
      });
      return Object.entries(counts).map(([date, count]) => ({ date, count }));
    }
    if (viewType === "renewals") {
      const counts: Record<string, number> = {};
      Object.entries(renewalsByDate || {}).forEach(([dateStr, list]) => {
        counts[dateStr] = list.length;
      });
      return Object.entries(counts).map(([date, count]) => ({ date, count }));
    }
    return calendarCounts;
  }, [viewType, calendarCounts, registrationsByDate, renewalsByDate]);

  // Sync state if year/month props change
  const [lastYearMonth, setLastYearMonth] = useState({ year, month });
  if (lastYearMonth.year !== year || lastYearMonth.month !== month) {
    setLastYearMonth({ year, month });
    setSelectedDate(defaultDate);
  }

  // ── Navigation helpers ────────────────────────────────────────────────────

  const [navDirection, setNavDirection] = useState<"prev" | "next" | null>(null);

  const navigate = (y: number, m: number, dir: "prev" | "next") => {
    setNavDirection(dir);
    const params = new URLSearchParams();
    params.set("year", String(y));
    params.set("month", String(m));
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const goToPrevMonth = () => {
    const newMonth = month === 1 ? 12 : month - 1;
    const newYear = month === 1 ? year - 1 : year;
    navigate(newYear, newMonth, "prev");
  };

  const goToNextMonth = () => {
    const now = new Date();
    const isCurrentMonth =
      year === now.getFullYear() && month === now.getMonth() + 1;
    if (isCurrentMonth) return; // don't navigate to future month
    const newMonth = month === 12 ? 1 : month + 1;
    const newYear = month === 12 ? year + 1 : year;
    navigate(newYear, newMonth, "next");
  };

  const selectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  // ── Formatted selected date ───────────────────────────────────────────────

  const selectedDateDisplay = useMemo(() => {
    const d = new Date(selectedDate + "T00:00:00");
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);



  const isAtCurrentMonth =
    year === new Date().getFullYear() && month === new Date().getMonth() + 1;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className={`space-y-4 pb-8 min-w-0 w-full transition-opacity duration-200 ${isPending ? "opacity-60" : ""}`}
    >
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col gap-4 pt-1 pb-1.5 mb-3">
        {/* Header Row 1: Title */}
        <div>
          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-zinc-900 dark:text-zinc-50">
            Attendance{" "}
            <span className="font-semibold text-brand-orange-500">
              Dashboard
            </span>
          </h1>
        </div>

        {/* Header Row 2: Stats (Left) and Month Navigator (Right) */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between pt-3 pb-2 sm:pt-5 sm:pb-2.5">
          {/* Left Part: Three Primary Stats styled exactly like Dashboard */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-start shrink-0">
            {/* Stat 1: Attended Today */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline-flex items-center justify-center p-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200/40 dark:border-zinc-800/40">
                  <Users className="h-4 w-4" />
                </span>
                <span className="text-3xl sm:text-4xl font-extralight text-zinc-900 dark:text-zinc-50 tracking-tight">
                  {kpis.todayCount}
                </span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left sm:pl-7 mt-0.5">
                Attended Today
              </p>
            </div>

            {/* Stat 2: Joined This Month */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline-flex items-center justify-center p-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200/40 dark:border-zinc-800/40">
                  <UserPlus className="h-4 w-4" />
                </span>
                <span className="text-3xl sm:text-4xl font-extralight text-zinc-900 dark:text-zinc-50 tracking-tight">
                  {kpis.newStudentsThisMonth}
                </span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left sm:pl-7 mt-0.5">
                Joined This Mo.
              </p>
            </div>

            {/* Stat 3: Renewals */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline-flex items-center justify-center p-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200/40 dark:border-zinc-800/40">
                  <RefreshCw className="h-4 w-4" />
                </span>
                <span className="text-3xl sm:text-4xl font-extralight text-zinc-900 dark:text-zinc-50 tracking-tight">
                  {kpis.renewalsThisMonth}
                </span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left sm:pl-7 mt-0.5">
                Renewals
              </p>
            </div>
          </div>

          {/* Right Part: Month Navigator */}
          <div className="flex items-center gap-1 -mb-3 ml-auto rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-1 shrink-0 shadow-sm max-w-xs self-start lg:self-end">
            <button
              onClick={goToPrevMonth}
              disabled={isPending}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                isPending
                  ? "text-zinc-300 dark:text-zinc-800 cursor-default opacity-40"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              }`}
            >
              {isPending && navDirection === "prev" ? (
                <Loader2 className="h-4 w-4 animate-spin text-brand-orange-500" />
              ) : (
                <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
              )}
            </button>
            <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300 min-w-[130px] text-center uppercase tracking-wider select-none tabular-nums">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button
              onClick={goToNextMonth}
              disabled={isPending || isAtCurrentMonth}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                isPending || isAtCurrentMonth
                  ? "text-zinc-300 dark:text-zinc-800 cursor-default opacity-40"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              }`}
            >
              {isPending && navDirection === "next" ? (
                <Loader2 className="h-4 w-4 animate-spin text-brand-orange-500" />
              ) : (
                <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Calendar + Roll Call ────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <CalendarViewCard
          year={year}
          month={month}
          todayStr={todayStr}
          selectedDate={selectedDate}
          onSelectDate={selectDate}
          calendarCounts={calendarCountsForView}
          viewType={viewType}
        />

        <RollCallCard
          selectedDate={selectedDate}
          selectedDateDisplay={selectedDateDisplay}
          rollCallByDate={rollCallByDate}
          registrationsByDate={registrationsByDate}
          renewalsByDate={renewalsByDate}
          viewType={viewType}
          onViewTypeChange={setViewType}
        />
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <AdmissionsRenewalsChartCard
        year={year}
        month={month}
        yearlyBreakdown={yearlyBreakdown}
        registrationsByDate={registrationsByDate}
        renewalsByDate={renewalsByDate}
      />
    </div>
  );
}
