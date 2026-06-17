"use client";

import { useState, useMemo } from "react";
import { toYMD, formatSessionDate } from "./types";
import type { PlanRow, AttendanceRow } from "./types";

// ─── Attendance Card ──────────────────────────────────────────────────────────

export function AttendanceCard({
  attendances,
  activePlan,
}: {
  attendances: AttendanceRow[];
  activePlan: PlanRow | null;
}) {
  const [showLogs, setShowLogs] = useState(false);

  const dates = attendances.map((a) => new Date(a.date).getTime());
  const earliestAttendance = dates.length > 0 ? new Date(Math.min(...dates)) : null;
  const latestAttendance = dates.length > 0 ? new Date(Math.max(...dates)) : null;

  const planStart = activePlan ? new Date(activePlan.startDate) : null;
  const planEnd = activePlan ? new Date(activePlan.endDate) : null;

  const calendarStart = useMemo(() => {
    let start = new Date();
    if (planStart && earliestAttendance) {
      start = planStart < earliestAttendance ? planStart : earliestAttendance;
    } else if (planStart) {
      start = planStart;
    } else if (earliestAttendance) {
      start = earliestAttendance;
    }
    return start;
  }, [planStart, earliestAttendance]);

  const calendarEnd = useMemo(() => {
    let end = new Date();
    if (planEnd && latestAttendance) {
      end = planEnd > latestAttendance ? planEnd : latestAttendance;
    } else if (planEnd) {
      end = planEnd;
    } else if (latestAttendance) {
      end = latestAttendance;
    }

    if (activePlan) {
      const { sessionsCompleted, totalSessions, endDate, expiryDate } = activePlan;
      let startLimit = new Date(expiryDate);
      if (sessionsCompleted >= totalSessions) {
        const activePlanAttendances = attendances.filter(a => a.studentPlanId === activePlan.id);
        const lastAttendanceDate = activePlanAttendances.length > 0 
          ? new Date(activePlanAttendances[activePlanAttendances.length - 1].date) 
          : null;
        if (lastAttendanceDate) {
          startLimit = new Date(lastAttendanceDate);
        } else {
          startLimit = new Date(endDate);
        }
      }
      const inactiveEnd = new Date(startLimit);
      inactiveEnd.setDate(inactiveEnd.getDate() + 30);
      if (inactiveEnd > end) {
        end = inactiveEnd;
      }
    }
    return end;
  }, [planEnd, latestAttendance, activePlan, attendances]);

  const months = useMemo(() => {
    const list: { year: number; month: number }[] = [];
    const curr = new Date(calendarStart.getFullYear(), calendarStart.getMonth(), 1);
    const last = new Date(calendarEnd.getFullYear(), calendarEnd.getMonth(), 1);

    let safetyCounter = 0;
    while (curr <= last && safetyCounter < 24) {
      list.push({ year: curr.getFullYear(), month: curr.getMonth() });
      curr.setMonth(curr.getMonth() + 1);
      safetyCounter++;
    }
    if (list.length === 0) {
      const today = new Date();
      list.push({ year: today.getFullYear(), month: today.getMonth() });
    }
    return list;
  }, [calendarStart, calendarEnd]);

  const attendanceMap = useMemo(() => {
    const map = new Map<string, number>();
    attendances.forEach((a, idx) => {
      map.set(toYMD(a.date), idx + 1);
    });
    return map;
  }, [attendances]);

  const isDateInActivePlanDuration = (year: number, month: number, day: number) => {
    if (!planStart || !planEnd) return false;
    const current = new Date(year, month, day).getTime();
    const start = new Date(planStart.getFullYear(), planStart.getMonth(), planStart.getDate()).getTime();
    const end = new Date(planEnd.getFullYear(), planEnd.getMonth(), planEnd.getDate()).getTime();
    return current >= start && current <= end;
  };

  const isClassDayOfWeek = (year: number, month: number, day: number) => {
    if (!activePlan || !Array.isArray(activePlan.selectedDays)) return false;
    const d = new Date(year, month, day);
    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
    return (activePlan.selectedDays as string[]).includes(dayName);
  };

  const isDateInFreezePeriod = (year: number, month: number, day: number) => {
    if (!activePlan) return false;
    const current = new Date(year, month, day).getTime();

    if (activePlan.freezePeriods && activePlan.freezePeriods.length > 0) {
      for (const fp of activePlan.freezePeriods) {
        const start = new Date(fp.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(fp.endDate);
        end.setHours(0, 0, 0, 0);
        if (current >= start.getTime() && current <= end.getTime()) {
          return true;
        }
      }
    }

    if (activePlan.freezeStartDate && activePlan.freezeEndDate) {
      const start = new Date(activePlan.freezeStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(activePlan.freezeEndDate);
      end.setHours(0, 0, 0, 0);
      return current >= start.getTime() && current <= end.getTime();
    }

    return false;
  };

  const isDateInGracePeriod = (year: number, month: number, day: number) => {
    if (!activePlan || !planEnd || !activePlan.expiryDate) return false;
    const current = new Date(year, month, day).getTime();
    const graceStartLimit = new Date(planEnd);
    graceStartLimit.setHours(23, 59, 59, 999);
    const graceEnd = new Date(activePlan.expiryDate);
    graceEnd.setHours(23, 59, 59, 999);
    return current > graceStartLimit.getTime() && current <= graceEnd.getTime();
  };

  const isDateInInactivePeriod = (year: number, month: number, day: number) => {
    if (!activePlan) return false;
    const current = new Date(year, month, day).getTime();
    const { sessionsCompleted, totalSessions, endDate, expiryDate } = activePlan;

    if (sessionsCompleted >= totalSessions) {
      const activePlanAttendances = attendances.filter(a => a.studentPlanId === activePlan.id);
      const lastAttendanceDate = activePlanAttendances.length > 0 
        ? new Date(activePlanAttendances[activePlanAttendances.length - 1].date) 
        : null;
      const startLimit = lastAttendanceDate ? new Date(lastAttendanceDate) : new Date(endDate);
      startLimit.setHours(23, 59, 59, 999);
      const endLimit = new Date(startLimit);
      endLimit.setDate(endLimit.getDate() + 30);
      endLimit.setHours(23, 59, 59, 999);
      return current > startLimit.getTime() && current <= endLimit.getTime();
    } else {
      if (!expiryDate) return false;
      const startLimit = new Date(expiryDate);
      startLimit.setHours(23, 59, 59, 999);
      const endLimit = new Date(startLimit);
      endLimit.setDate(endLimit.getDate() + 30);
      endLimit.setHours(23, 59, 59, 999);
      return current > startLimit.getTime() && current <= endLimit.getTime();
    }
  };

  const todayYMD = toYMD(new Date());

  return (
    <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Attendance &amp; Schedule
        </h2>
        <div className="flex items-center gap-3.5">
          {activePlan && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500 hidden sm:inline">
              Plan period:{" "}
              {new Date(activePlan.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{" "}
              to{" "}
              {new Date(activePlan.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
          {attendances.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLogs(!showLogs)}
              className="text-xs font-semibold text-brand-orange-500 hover:text-brand-orange-600 transition-colors cursor-pointer"
            >
              {showLogs ? "Hide logs" : "Show logs"}
            </button>
          )}
        </div>
      </div>

      <div className={showLogs ? "grid gap-6 md:grid-cols-[1fr_260px]" : "w-full"}>
        {/* Scrollable multi-month grid */}
        <div className="flex flex-col min-w-0 justify-between">
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin snap-x">
            {months.map(({ year, month }) => {
              const monthName = new Date(year, month, 1).toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              });
              const firstDay = new Date(year, month, 1).getDay();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const cells = [
                ...Array(firstDay).fill(null),
                ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
              ];

              return (
                <div key={`${year}-${month}`} className="w-[260px] shrink-0 snap-start">
                  <div className="text-center pb-2 border-b border-zinc-100 dark:border-zinc-850 mb-2">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {monthName}
                    </span>
                  </div>

                  <div className="grid grid-cols-7 text-center text-[9px] font-bold text-zinc-400 dark:text-zinc-550 uppercase pb-1">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((day, idx) => {
                      if (!day) return <div key={`empty-${idx}`} />;
                      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const sessionNum = attendanceMap.get(dateKey);
                      const isPresent = sessionNum !== undefined;
                      const isFreeze = isDateInFreezePeriod(year, month, day);
                      const isGrace = isDateInGracePeriod(year, month, day);
                      const isInactive = isDateInInactivePeriod(year, month, day);
                      const isClassDay =
                        isDateInActivePlanDuration(year, month, day) &&
                        isClassDayOfWeek(year, month, day);
                      const isToday = dateKey === todayYMD;

                      let cellStyle = "text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/40";
                      if (isPresent) {
                        cellStyle = "bg-brand-orange-500 text-white font-bold shadow-xs";
                      } else if (isFreeze) {
                        cellStyle = "bg-sky-50/60 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 font-semibold border border-sky-500/10";
                      } else if (isGrace) {
                        cellStyle = "bg-purple-50/60 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 font-semibold border border-purple-500/10";
                      } else if (isInactive) {
                        cellStyle = "bg-rose-950/10 dark:bg-rose-950/25 text-rose-900 dark:text-rose-400 font-semibold border border-rose-900/15";
                      } else if (isClassDay) {
                        cellStyle = "bg-brand-orange-50/60 dark:bg-brand-orange-950/20 text-brand-orange-700 dark:text-brand-orange-400 font-semibold border border-brand-orange-500/10";
                      }

                      return (
                        <div
                          key={dateKey}
                          className={`flex flex-col items-center justify-center h-8 rounded-lg text-[10px] transition-colors relative cursor-default ${cellStyle} ${
                            isToday ? "ring-2 ring-zinc-950 dark:ring-zinc-100 ring-offset-1 dark:ring-offset-zinc-900" : ""
                          }`}
                        >
                          {isPresent ? (
                            <div className="flex flex-col items-center justify-center leading-none">
                              <span className="text-[11px] font-bold">S{sessionNum}</span>
                              <span className="text-[7px] opacity-80 font-normal mt-0.5">{day}</span>
                            </div>
                          ) : (
                            <span className="leading-none">{day}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-zinc-100 dark:border-zinc-800 mt-2 pt-3 text-[10px] text-zinc-400 dark:text-zinc-550">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded bg-brand-orange-500" />
              <span>Attended</span>
            </div>
            {activePlan && (
              <>
                {Array.isArray(activePlan.selectedDays) && activePlan.selectedDays.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded bg-brand-orange-200 dark:bg-brand-orange-800" />
                    <span>Class days</span>
                  </div>
                )}
                {((activePlan.freezeStartDate && activePlan.freezeEndDate) || (activePlan.freezePeriods && activePlan.freezePeriods.length > 0)) && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded bg-sky-400 dark:bg-sky-600" />
                    <span>Frozen</span>
                  </div>
                )}
                {activePlan.graceDays > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded bg-purple-400 dark:bg-purple-600" />
                    <span>Grace</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded bg-rose-950/20 dark:bg-rose-905" />
                  <span>Inactive</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sessions list */}
        {showLogs && (
          <div className="flex flex-col min-w-0 md:border-l md:border-zinc-100 md:dark:border-zinc-800 md:pl-6">
            <div className="space-y-1 overflow-y-auto max-h-[300px] pr-1">
              {attendances.length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 py-10 text-center">
                  No sessions attended yet.
                </p>
              ) : (
                attendances
                  .slice()
                  .reverse()
                  .map((a, idx) => {
                    const sessionIndex = attendances.length - idx;
                    return (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-orange-50 dark:bg-brand-orange-950/40 text-brand-orange-600 dark:text-brand-orange-400 text-[11px] font-bold shrink-0">
                          {sessionIndex}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                            Session {sessionIndex}
                          </p>
                          <p className="text-sm font-semibold text-zinc-855 dark:text-zinc-200 truncate">
                            {formatSessionDate(a.date)}
                          </p>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
