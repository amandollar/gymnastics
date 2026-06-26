"use client";

import { useState, useTransition, useMemo, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Check,
  X as CloseIcon,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  markCoachAttendanceAction,
  deleteCoachAttendanceAction,
} from "@/lib/actions/coaches";
import type { CoachWithStats } from "@/lib/services/coaches";
import type { CoachAttendanceStatus } from "@prisma/client";

interface Props {
  coaches: CoachWithStats[];
  attendanceData: Record<string, Record<string, CoachAttendanceStatus>>;
  year: number;
  month: number;
  todayStr: string;
}

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

export default function CoachesAttendanceClient({
  coaches,
  attendanceData: initialAttendance,
  year,
  month,
  todayStr,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Local state for attendance to allow instant optimistic updates
  const [attendance, setAttendance] = useState<Record<string, Record<string, CoachAttendanceStatus>>>(initialAttendance);
  const [updatingCells, setUpdatingCells] = useState<Record<string, boolean>>({});

  // Ref for the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to today's date column if it exists in the current month/year
    const timer = setTimeout(() => {
      const todayEl = document.getElementById("today-col");
      const container = scrollContainerRef.current;
      if (todayEl && container) {
        const offsetLeft = todayEl.offsetLeft;
        const containerWidth = container.clientWidth;
        const cellWidth = todayEl.clientWidth;
        container.scrollLeft = offsetLeft - containerWidth / 2 + cellWidth / 2;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [year, month, todayStr]);

  // Sync state if initialAttendance props change from server
  const [lastInitial, setLastInitial] = useState(initialAttendance);
  if (JSON.stringify(lastInitial) !== JSON.stringify(initialAttendance)) {
    setLastInitial(initialAttendance);
    setAttendance(initialAttendance);
  }

  // Calculate days in the selected month
  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  // Sort coaches: active ("WORKING") coaches first, then inactive ("LEFT")
  const sortedCoaches = useMemo(() => {
    return [...coaches].sort((a, b) => {
      if (a.status === "WORKING" && b.status !== "WORKING") return -1;
      if (a.status !== "WORKING" && b.status === "WORKING") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [coaches]);

  // Month navigation
  const navigateMonth = (dir: -1 | 1) => {
    let m = month + dir;
    let y = year;
    if (m < 1) {
      m = 12;
      y--;
    } else if (m > 12) {
      m = 1;
      y++;
    }

    // Don't navigate into future months
    const today = new Date();
    const todayY = today.getFullYear();
    const todayM = today.getMonth() + 1;
    if (y > todayY || (y === todayY && m > todayM)) {
      return;
    }

    const params = new URLSearchParams();
    params.set("year", String(y));
    params.set("month", String(m));
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const isAtCurrentMonth = useMemo(() => {
    const today = new Date();
    return year === today.getFullYear() && month === today.getMonth() + 1;
  }, [year, month]);

  // Handle cell click (cycle: Unmarked -> PRESENT -> ABSENT -> Unmarked)
  const handleCellClick = async (coachId: string, day: number, leftDateStr?: string | null) => {
    const dayStr = String(day).padStart(2, "0");
    const monthStr = String(month).padStart(2, "0");
    const cellDateStr = `${year}-${monthStr}-${dayStr}`;

    // Block future dates
    if (cellDateStr > todayStr) return;

    // Block dates on/after leftDate
    if (leftDateStr) {
      const leftMidnight = leftDateStr.split("T")[0]; // Normalize to YYYY-MM-DD
      if (cellDateStr >= leftMidnight) return;
    }

    const cellKey = `${coachId}-${cellDateStr}`;
    if (updatingCells[cellKey]) return;

    const currentStatus = attendance[coachId]?.[cellDateStr] || null;
    let nextStatus: CoachAttendanceStatus | null = null;

    if (currentStatus === null) {
      nextStatus = "PRESENT";
    } else if (currentStatus === "PRESENT") {
      nextStatus = "ABSENT";
    } else if (currentStatus === "ABSENT") {
      nextStatus = null;
    }

    // 1. Optimistic Update
    setAttendance((prev) => {
      const copy = { ...prev };
      if (!copy[coachId]) copy[coachId] = {};
      if (nextStatus === null) {
        delete copy[coachId][cellDateStr];
      } else {
        copy[coachId][cellDateStr] = nextStatus;
      }
      return copy;
    });

    setUpdatingCells((prev) => ({ ...prev, [cellKey]: true }));

    try {
      // 2. Perform DB Save
      if (nextStatus === null) {
        await deleteCoachAttendanceAction(coachId, cellDateStr);
      } else {
        await markCoachAttendanceAction(coachId, cellDateStr, nextStatus);
      }
    } catch (err) {
      console.error("Failed to update coach attendance:", err);
      // Revert optimistic update on failure
      setAttendance((prev) => {
        const copy = { ...prev };
        if (!copy[coachId]) copy[coachId] = {};
        if (currentStatus === null) {
          delete copy[coachId][cellDateStr];
        } else {
          copy[coachId][cellDateStr] = currentStatus;
        }
        return copy;
      });
    } finally {
      setUpdatingCells((prev) => {
        const copy = { ...prev };
        delete copy[cellKey];
        return copy;
      });
    }
  };

  return (
    <div className={`space-y-6 min-w-0 w-full pb-10 transition-opacity duration-200 ${isPending ? "opacity-60" : ""}`}>
      {/* Back button and title */}
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/coaches"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-brand-orange-500 dark:hover:text-brand-orange-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Coach & Staff
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-zinc-900 dark:text-zinc-50">
              Coach & Staff{" "}
              <span className="font-semibold text-brand-orange-500">
                Attendance
              </span>
            </h1>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-1 shrink-0 shadow-sm max-w-xs self-start sm:self-center">
            <button
              onClick={() => navigateMonth(-1)}
              disabled={isPending}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                isPending
                  ? "text-zinc-300 dark:text-zinc-800 cursor-default opacity-40"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              }`}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300 min-w-[130px] text-center uppercase tracking-wider select-none tabular-nums">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              disabled={isPending || isAtCurrentMonth}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                isPending || isAtCurrentMonth
                  ? "text-zinc-300 dark:text-zinc-800 cursor-default opacity-40"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              }`}
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-hidden rounded-3xl border border-zinc-200/65 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm">
        <div ref={scrollContainerRef} className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 text-zinc-400 dark:text-zinc-500">
                {/* Sticky Left Header for Employee Column */}
                <th className="sticky left-0 z-20 bg-zinc-50 dark:bg-zinc-900 px-6 py-4 text-xs font-bold uppercase tracking-wider min-w-[200px] border-r border-zinc-100 dark:border-zinc-800">
                  Coach / Staff Name
                </th>
                {/* Day Columns */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayDate = new Date(year, month - 1, day);
                  const isSunday = dayDate.getDay() === 0;
                  const dayStr = String(day).padStart(2, "0");
                  const monthStr = String(month).padStart(2, "0");
                  const cellDateStr = `${year}-${monthStr}-${dayStr}`;
                  const isFuture = cellDateStr > todayStr;
                  const isToday = cellDateStr === todayStr;

                  if (isSunday) {
                    return (
                      <th
                        id={isToday ? "today-col" : undefined}
                        key={day}
                        className={`px-1 py-4 text-center text-xs font-black w-8 min-w-[32px] border-r border-zinc-200 dark:border-zinc-800 ${
                          isToday
                            ? "bg-brand-orange-100/50 dark:bg-brand-orange-950/30 text-brand-orange-600 dark:text-brand-orange-400 border-x-2 border-x-brand-orange-500/30"
                            : "bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {day}
                      </th>
                    );
                  }

                  return (
                    <th
                      id={isToday ? "today-col" : undefined}
                      key={day}
                      className={`px-2.5 py-4 text-center text-xs font-bold min-w-[36px] border-r border-zinc-100 dark:border-zinc-800 ${
                        isToday
                          ? "text-brand-orange-600 dark:text-brand-orange-400 font-extrabold bg-brand-orange-100/50 dark:bg-brand-orange-950/30 border-x-2 border-x-brand-orange-500/30"
                          : isFuture
                          ? "opacity-45"
                          : ""
                      }`}
                    >
                      {day}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedCoaches.map((coach, rowIndex) => {
                const isEven = rowIndex % 2 === 0;
                // Alternate row backgrounds (needs to be explicitly set so sticky column background matches)
                const rowBgCls = isEven
                  ? "bg-white dark:bg-zinc-900"
                  : "bg-zinc-50 dark:bg-zinc-950";
                const isWorking = coach.status === "WORKING";

                return (
                  <tr
                    key={coach.id}
                    className={`group border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10 transition-colors ${rowBgCls} ${
                      !isWorking ? "opacity-75 hover:opacity-100" : ""
                    }`}
                  >
                    {/* Sticky Coach Profiling Cell */}
                    <td
                      className={`sticky left-0 z-10 px-6 py-3.5 border-r border-zinc-100 dark:border-zinc-800 flex items-center gap-3 transition-colors ${
                        isEven
                          ? "bg-white dark:bg-zinc-900 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800"
                          : "bg-zinc-50 dark:bg-zinc-950 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800"
                      }`}
                    >
                      <img
                        src={coach.avatarUrl || (coach.role === "STAFF" ? "/staff-profile-placeholder.webp" : "/coach-profile-placeholder.webp")}
                        alt={coach.name}
                        className="h-8 w-8 rounded-xl object-cover bg-zinc-100 dark:bg-zinc-800"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {coach.name}
                        </p>
                        {!isWorking && (
                          <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                            Left
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Attendance Grid Cells */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dayDate = new Date(year, month - 1, day);
                      const isSunday = dayDate.getDay() === 0;

                      const dayStr = String(day).padStart(2, "0");
                      const monthStr = String(month).padStart(2, "0");
                      const cellDateStr = `${year}-${monthStr}-${dayStr}`;
                      const isFuture = cellDateStr > todayStr;
                      const isToday = cellDateStr === todayStr;

                      // Compute leftDate block — normalize to YYYY-MM-DD
                      const leftMidnight = coach.leftDate
                        ? (coach.leftDate as string).split("T")[0]
                        : null;
                      const isBlockedByLeftDate = !!(leftMidnight && cellDateStr >= leftMidnight);

                      if (isSunday) {
                        if (rowIndex === 0) {
                          return (
                            <td
                              key={day}
                              rowSpan={sortedCoaches.length}
                              className={`text-center font-bold text-[9px] tracking-[0.25em] uppercase select-none w-8 min-w-[32px] p-0 align-middle ${
                                isToday
                                  ? "bg-brand-orange-100/20 dark:bg-brand-orange-950/15 text-brand-orange-600 dark:text-brand-orange-400 border-x-2 border-x-brand-orange-500/30 border-r border-zinc-200 dark:border-zinc-800"
                                  : "bg-rose-50/25 dark:bg-rose-950/5 text-rose-500/70 dark:text-rose-400/60 border-r border-zinc-200 dark:border-zinc-800"
                              }`}
                            >
                              <div className="inline-block [writing-mode:vertical-lr] rotate-180 py-4 select-none font-bold text-center leading-none">
                                Sunday
                              </div>
                            </td>
                          );
                        } else {
                          return null;
                        }
                      }

                      const status = attendance[coach.id]?.[cellDateStr] || null;
                      const cellKey = `${coach.id}-${cellDateStr}`;
                      const isUpdating = updatingCells[cellKey];

                      // Styling mapping
                      let cellContent = null;
                      let cellCls = "text-zinc-300 dark:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer";

                      if (isBlockedByLeftDate) {
                        // Show a diagonal-line pattern for cells blocked after leftDate
                        cellContent = null;
                        cellCls = "cursor-not-allowed select-none bg-zinc-100/80 dark:bg-zinc-800/50";
                      } else if (isUpdating) {
                        cellContent = <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />;
                        cellCls = "cursor-wait bg-zinc-50 dark:bg-zinc-800/40";
                      } else if (status === "PRESENT") {
                        cellContent = <Check className="h-3.5 w-3.5 stroke-[3]" />;
                        cellCls = "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 cursor-pointer";
                      } else if (status === "ABSENT") {
                        cellContent = <CloseIcon className="h-3.5 w-3.5 stroke-[3]" />;
                        cellCls = "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 dark:hover:bg-rose-500/30 cursor-pointer";
                      } else if (isFuture) {
                        cellContent = null;
                        cellCls = "cursor-not-allowed text-transparent select-none bg-zinc-50/20 dark:bg-zinc-900/20";
                      } else {
                        // Empty/Unmarked cell
                        cellContent = <span className="h-1.5 w-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700" />;
                      }

                      return (
                        <td
                          key={day}
                          onClick={() => !isFuture && !isBlockedByLeftDate && handleCellClick(coach.id, day, coach.leftDate as string | null)}
                          className={`p-1.5 text-center transition-all border-r border-zinc-100/60 dark:border-zinc-800/40 select-none ${cellCls} ${
                            isToday ? "border-x-2 border-x-brand-orange-500/30" : ""
                          } ${
                            isToday && !status && !isUpdating && !isBlockedByLeftDate ? "bg-brand-orange-100/10 dark:bg-brand-orange-950/10" : ""
                          }`}
                          title={
                            isBlockedByLeftDate
                              ? `${coach.name} left on ${leftMidnight}. Attendance cannot be marked after this date.`
                              : isFuture
                              ? "Future Date"
                              : `${coach.name} - ${MONTH_NAMES[month - 1]} ${day}: ${
                                  status ? status : "Unmarked"
                                }`
                          }
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg mx-auto font-bold transition-transform active:scale-90">
                            {isBlockedByLeftDate ? (
                              <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden="true">
                                <line x1="0" y1="0" x2="28" y2="28" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300 dark:text-zinc-600" />
                              </svg>
                            ) : cellContent}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
