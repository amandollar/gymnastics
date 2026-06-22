"use client";

import { useMemo } from "react";
import type { DayAttendanceCount } from "@/lib/services/attendance";

// ─── Heatmap intensity ────────────────────────────────────────────────────────

function heatClass(
  count: number,
  max: number,
  viewType: "attendance" | "registrations" | "renewals"
): string {
  if (count === 0 || max === 0) return "";
  const r = count / max;

  if (viewType === "renewals") {
    if (r < 0.25)
      return "bg-violet-500/[0.08] text-violet-600 dark:text-violet-400 hover:bg-violet-500/[0.12]";
    if (r < 0.5)
      return "bg-violet-500/[0.22] text-violet-700 dark:text-violet-300 hover:bg-violet-500/[0.26]";
    if (r < 0.75)
      return "bg-violet-500/[0.42] text-violet-800 dark:text-violet-200 hover:bg-violet-500/[0.48]";
    return "bg-violet-500/[0.75] text-white hover:bg-violet-500/[0.82]";
  }

  if (viewType === "registrations") {
    if (r < 0.25)
      return "bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/[0.12]";
    if (r < 0.5)
      return "bg-emerald-500/[0.22] text-emerald-700 dark:text-emerald-350 hover:bg-emerald-500/[0.26]";
    if (r < 0.75)
      return "bg-emerald-500/[0.42] text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/[0.48]";
    return "bg-emerald-500/[0.75] text-white hover:bg-emerald-500/[0.82]";
  }

  // default: attendance (orange)
  if (r < 0.25)
    return "bg-brand-orange-500/[0.08] text-brand-orange-600 dark:text-brand-orange-400 hover:bg-brand-orange-500/[0.12]";
  if (r < 0.5)
    return "bg-brand-orange-500/[0.22] text-brand-orange-700 dark:text-brand-orange-300 hover:bg-brand-orange-500/[0.26]";
  if (r < 0.75)
    return "bg-brand-orange-500/[0.42] text-brand-orange-800 dark:text-brand-orange-200 hover:bg-brand-orange-500/[0.48]";
  return "bg-brand-orange-500/[0.75] text-white hover:bg-brand-orange-500/[0.82]";
}

// ─── Calendar Cell ────────────────────────────────────────────────────────────

interface CalendarCellProps {
  day: number;
  count: number;
  maxCount: number;
  isSelected: boolean;
  isToday: boolean;
  isFuture: boolean;
  onClick: () => void;
  viewType: "attendance" | "registrations" | "renewals";
}

function CalendarCell({
  day,
  count,
  maxCount,
  isSelected,
  isToday,
  isFuture,
  onClick,
  viewType,
}: CalendarCellProps) {
  const hasData = count > 0;

  // Base button classes: slightly rectangular aspect ratio, padding, full width
  const baseButtonClasses = `
    relative flex flex-col justify-between p-2 sm:p-2.5 w-full aspect-[1/1.2] sm:aspect-[1.3/1] rounded-lg sm:rounded-2xl transition-all duration-200 select-none
  `;

  // Determine state classes (bg, text, hover, border)
  let stateClasses = "";

  if (isFuture) {
    stateClasses =
      "bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-300 dark:text-zinc-800 cursor-default opacity-40";
  } else {
    // 1. Background and base text colors
    if (hasData) {
      stateClasses = heatClass(count, maxCount, viewType);
    } else {
      stateClasses =
        "bg-zinc-50/60 dark:bg-zinc-900/30 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50";
    }

    // 2. Selection border: selection gives a border instead of solid background
    if (isSelected) {
      const ringColor =
        viewType === "attendance"
          ? "ring-brand-orange-500"
          : viewType === "renewals"
            ? "ring-violet-500"
            : "ring-emerald-500";
      stateClasses += ` ring-2 ${ringColor} ring-offset-1 dark:ring-offset-zinc-950 scale-[1.04] z-10 shadow-sm`;
    } else {
      stateClasses += " hover:scale-[1.02] cursor-pointer";
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={isFuture}
      className={`${baseButtonClasses} ${stateClasses}`}
    >
      {/* Top Left: Date number */}
      <span className="text-[10px] sm:text-[11px] font-bold self-start leading-none opacity-80">
        {day}
      </span>

      {/* Bottom Right: Count text (larger and thinner) */}
      {hasData && (
        <span className="text-sm sm:text-[26px] font-light self-end leading-none tracking-tight">
          {count}
        </span>
      )}

      {/* Today Indicator dot (top-right corner) */}
      {isToday && !isFuture && (
        <span className={`absolute top-2 right-2 h-1.5 w-1.5 rounded-full ${
          viewType === "attendance"
            ? "bg-brand-orange-500"
            : viewType === "renewals"
              ? "bg-violet-500"
              : "bg-emerald-500"
        }`} />
      )}
    </button>
  );
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CalendarViewCardProps {
  year: number;
  month: number;
  todayStr: string;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  calendarCounts: DayAttendanceCount[];
  viewType: "attendance" | "registrations" | "renewals";
}

export default function CalendarViewCard({
  year,
  month,
  todayStr,
  selectedDate,
  onSelectDate,
  calendarCounts,
  viewType,
}: CalendarViewCardProps) {
  // ── Build a lookup map: dateStr → count ───────────────────────────────────

  const countMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of calendarCounts) m.set(d.date, d.count);
    return m;
  }, [calendarCounts]);

  const maxCount = useMemo(
    () => Math.max(...calendarCounts.map((d) => d.count), 1),
    [calendarCounts],
  );

  // ── Build calendar grid ───────────────────────────────────────────────────

  const { daysInMonth, leadingBlanks } = useMemo(() => {
    const dim = new Date(year, month, 0).getDate(); // days in month
    const firstDayJS = new Date(Date.UTC(year, month - 1, 1)).getDay(); // 0=Sun
    const blanks = firstDayJS === 0 ? 6 : firstDayJS - 1; // Mon-first
    return { daysInMonth: dim, leadingBlanks: blanks };
  }, [year, month]);

  // ── Local KPI computations ───────────────────────────────────────────────

  const { total, avg } = useMemo(() => {
    let sum = 0;
    let activeDays = 0;
    for (const d of calendarCounts) {
      if (d.count > 0) {
        sum += d.count;
        activeDays++;
      }
    }
    const average = activeDays > 0 ? Math.round(sum / activeDays) : 0;
    return { total: sum, avg: average };
  }, [calendarCounts]);

  const headerText = useMemo(() => {
    if (viewType === "attendance") return "Attendance View";
    if (viewType === "registrations") return "Registrations View";
    if (viewType === "renewals") return "Renewals View";
    return "Calendar View";
  }, [viewType]);

  return (
    <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 flex flex-col justify-between h-auto lg:h-[520px] min-w-[320px]">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              {headerText}
            </h2>
          </div>
          {/* Summary Stats */}
          <div className="text-[10px] sm:text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider select-none text-right">
            Total:{" "}
            <span className="font-extrabold text-zinc-700 dark:text-zinc-300">
              {total.toLocaleString("en-IN")}
            </span>{" "}
            · Avg:{" "}
            <span className="font-extrabold text-zinc-700 dark:text-zinc-300">
              {avg}/d
            </span>
          </div>
        </div>

        <div className="w-full">
          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1.5 items-center">
            {/* Leading blanks */}
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`b-${i}`} className="aspect-square" />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const count = countMap.get(dateStr) ?? 0;
              const isFuture = dateStr > todayStr;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <CalendarCell
                  key={dateStr}
                  day={dayNum}
                  count={count}
                  maxCount={maxCount}
                  isSelected={isSelected}
                  isToday={isToday}
                  isFuture={isFuture}
                  onClick={() => !isFuture && onSelectDate(dateStr)}
                  viewType={viewType}
                />
              );
            })}
          </div>
        </div>
      </div>
      {/* Bottom Legend taking minimal height */}
      <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider select-none mt-2 shrink-0">
        <span>Less</span>
        <div className="flex gap-0.5 items-center">
          <div className="h-1.5 w-1.5 rounded-sm bg-zinc-100 dark:bg-zinc-800/60" />
          {viewType === "attendance" && (
            <>
              <div className="h-1.5 w-1.5 rounded-sm bg-brand-orange-500/[0.08]" />
              <div className="h-1.5 w-1.5 rounded-sm bg-brand-orange-500/[0.22]" />
              <div className="h-1.5 w-1.5 rounded-sm bg-brand-orange-500/[0.42]" />
              <div className="h-1.5 w-1.5 rounded-sm bg-brand-orange-500" />
            </>
          )}
          {viewType === "renewals" && (
            <>
              <div className="h-1.5 w-1.5 rounded-sm bg-violet-500/[0.08]" />
              <div className="h-1.5 w-1.5 rounded-sm bg-violet-500/[0.22]" />
              <div className="h-1.5 w-1.5 rounded-sm bg-violet-500/[0.42]" />
              <div className="h-1.5 w-1.5 rounded-sm bg-violet-500" />
            </>
          )}
          {viewType === "registrations" && (
            <>
              <div className="h-1.5 w-1.5 rounded-sm bg-emerald-500/[0.08]" />
              <div className="h-1.5 w-1.5 rounded-sm bg-emerald-500/[0.22]" />
              <div className="h-1.5 w-1.5 rounded-sm bg-emerald-500/[0.42]" />
              <div className="h-1.5 w-1.5 rounded-sm bg-emerald-500" />
            </>
          )}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
