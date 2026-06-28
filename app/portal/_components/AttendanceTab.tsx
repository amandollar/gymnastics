"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import { Snowflake, Info, X } from "lucide-react";

interface AttendanceTabProps {
  student: any;
}

export default function AttendanceTab({ student }: AttendanceTabProps) {
  const currentMonthRef = useRef<HTMLDivElement | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const activePlan = student.plans?.find((p: any) => p.isActive) || null;
  const attendances = student.attendances || [];

  const toYMD = (d: Date | string) => {
    const date = new Date(d);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const attendanceDatesSet = useMemo(() => {
    const set = new Set<string>();
    attendances.forEach((a: any) => {
      set.add(toYMD(a.date));
    });
    return set;
  }, [attendances]);

  const isFrozenDate = (year: number, month: number, day: number): boolean => {
    if (!activePlan) return false;
    const current = new Date(year, month, day).getTime();

    if (activePlan.freezeStartDate && activePlan.freezeEndDate) {
      const start = new Date(activePlan.freezeStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(activePlan.freezeEndDate);
      end.setHours(23, 59, 59, 999);
      if (current >= start.getTime() && current <= end.getTime()) return true;
    }

    if (activePlan.freezePeriods && activePlan.freezePeriods.length > 0) {
      for (const fp of activePlan.freezePeriods) {
        const start = new Date(fp.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(fp.endDate);
        end.setHours(23, 59, 59, 999);
        if (current >= start.getTime() && current <= end.getTime()) return true;
      }
    }
    return false;
  };

  const isGraceDate = (year: number, month: number, day: number): boolean => {
    if (!activePlan || !activePlan.expiryDate) return false;
    const current = new Date(year, month, day).getTime();
    const pEnd = new Date(activePlan.endDate);
    pEnd.setHours(23, 59, 59, 999);
    const pExpiry = new Date(activePlan.expiryDate);
    pExpiry.setHours(23, 59, 59, 999);
    return current > pEnd.getTime() && current <= pExpiry.getTime();
  };

  const isExpiredDate = (year: number, month: number, day: number): boolean => {
    if (!activePlan) return false;
    const current = new Date(year, month, day).getTime();
    const pExpiry = new Date(activePlan.expiryDate || activePlan.endDate);
    pExpiry.setHours(23, 59, 59, 999);
    return current > pExpiry.getTime();
  };

  const isInactiveDate = (year: number, month: number, day: number): boolean => {
    if (!activePlan) return false;
    return isExpiredDate(year, month, day);
  };

  const isClassDay = (year: number, month: number, day: number): boolean => {
    if (!activePlan || !Array.isArray(activePlan.selectedDays)) return false;
    const d = new Date(year, month, day);

    const pStart = new Date(activePlan.startDate);
    pStart.setHours(0, 0, 0, 0);
    const pEnd = new Date(activePlan.endDate);
    pEnd.setHours(23, 59, 59, 999);
    const current = d.getTime();
    if (current < pStart.getTime() || current > pEnd.getTime()) return false;

    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
    return activePlan.selectedDays.includes(dayName);
  };

  const calendarMonths = useMemo(() => {
    const list: { year: number; month: number }[] = [];
    const today = new Date();
    let start = new Date(today.getFullYear(), today.getMonth(), 1);

    if (activePlan) {
      const planStart = new Date(activePlan.startDate);
      start = new Date(planStart.getFullYear(), planStart.getMonth(), 1);
    }

    let end = new Date(today.getFullYear(), today.getMonth() + 2, 1);
    if (activePlan) {
      const planEnd = new Date(activePlan.expiryDate || activePlan.endDate);
      end = new Date(planEnd.getFullYear(), planEnd.getMonth() + 1, 1);
    }

    const curr = new Date(start);
    let safety = 0;
    while (curr <= end && safety < 12) {
      list.push({ year: curr.getFullYear(), month: curr.getMonth() });
      curr.setMonth(curr.getMonth() + 1);
      safety++;
    }

    if (list.length === 0) {
      list.push({ year: today.getFullYear(), month: today.getMonth() });
    }
    return list;
  }, [activePlan]);

  const todayYMD = toYMD(new Date());

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentMonthRef.current) {
        currentMonthRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="animate-fade-in space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="hidden md:flex items-center justify-between pb-2 border-b border-zinc-200/50 dark:border-zinc-800/40">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Attendance</h1>
          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-550 dark:text-zinc-400 hover:text-brand-orange-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="View status glossary"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Legend Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-3 sm:px-4 sm:py-3.5 rounded-[1.25rem] shadow-sm border border-zinc-200/60 dark:border-zinc-800/80 mb-2 mt-1">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-zinc-555 dark:text-zinc-400 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.4)]" />
            <span>Attended</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ffd8b8]" />
            <span>Class days</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ebd4ff]" />
            <span>Grace</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#dfc4cb]" />
            <span>Inactive</span>
          </div>
        </div>

        {activePlan && student.status !== "INACTIVE" && student.status !== "EXPIRED" && (
          <div className="flex items-center gap-4 sm:pl-5 sm:border-l sm:border-zinc-150 sm:dark:border-zinc-800/60 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Sessions</span>
              <div className="text-sm font-black text-zinc-850 dark:text-zinc-100 flex items-baseline gap-0.5 leading-none">
                <span className="text-brand-orange-500 text-base">{activePlan.sessionsCompleted}</span>
                <span className="text-zinc-300 dark:text-zinc-600 text-xs">/</span>
                <span className="text-xs">{activePlan.totalSessions}</span>
              </div>
            </div>

            <div className="flex-1 sm:w-32 h-2.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden shrink-0 ring-1 ring-inset ring-zinc-200/50 dark:ring-zinc-800/50 relative">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-orange-400 to-brand-orange-500 rounded-full transition-all duration-700 ease-out shadow-[inset_0_-1px_2px_rgba(0,0,0,0.1)]"
                style={{ width: `${Math.min(100, (activePlan.sessionsCompleted / activePlan.totalSessions) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Calendar Months Grid */}
      <div className="w-full">
        <div className="flex flex-col min-w-0 justify-between">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 px-1 pb-4 w-full max-w-6xl mx-auto">
            {calendarMonths.map(({ year, month }) => {
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

              const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth();

              return (
                <div
                  key={`${year}-${month}`}
                  ref={isCurrentMonth ? currentMonthRef : undefined}
                  className="w-full shrink-0 bg-white dark:bg-zinc-900 rounded-[1.25rem] p-3.5 shadow-sm border border-zinc-200/60 dark:border-zinc-800/80"
                >
                  <div className="text-center pb-3 border-b border-zinc-100 dark:border-zinc-800/80 mb-3">
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      {monthName}
                    </span>
                  </div>

                  <div className="grid grid-cols-7 text-center text-[9px] font-bold text-zinc-400 dark:text-zinc-550 uppercase pb-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => (
                      <span key={idx}>{d}</span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((day, idx) => {
                      if (!day) return <div key={`empty-${idx}`} />;
                      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const isPresent = attendanceDatesSet.has(dateKey);
                      const isFrozen = isFrozenDate(year, month, day);
                      const isClass = isClassDay(year, month, day);
                      const isGrace = isGraceDate(year, month, day);
                      const isInactive = isInactiveDate(year, month, day);
                      const isExpired = isExpiredDate(year, month, day);
                      const isToday = dateKey === todayYMD;

                      const sessionIdx = attendances.findIndex((a: any) => toYMD(a.date) === dateKey);
                      const sessionNum = sessionIdx !== -1 ? sessionIdx + 1 : null;

                      let cellStyle = "text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/40";
                      if (isPresent) {
                        cellStyle = "bg-brand-orange-500 text-white font-bold shadow-xs";
                      } else if (isFrozen) {
                        cellStyle = "bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 font-medium border border-sky-200 dark:border-sky-800/50";
                      } else if (isGrace) {
                        cellStyle = "bg-[#fcfaff] dark:bg-purple-900/20 text-[#8b3dff] dark:text-purple-300 font-medium border border-[#ebd4ff] dark:border-purple-800/50";
                      } else if (isExpired || isInactive) {
                        cellStyle = "bg-[#faeef0] dark:bg-rose-950/30 text-[#853549] dark:text-rose-300 font-medium border border-[#dfc4cb] dark:border-rose-900/60";
                      } else if (isClass) {
                        cellStyle = "bg-[#fff4eb] dark:bg-brand-orange-900/20 text-zinc-800 dark:text-brand-orange-100 font-medium border border-[#ffd8b8] dark:border-brand-orange-800/50";
                      }

                      return (
                        <div
                          key={dateKey}
                          className={`relative h-11 sm:h-12 rounded-xl transition-colors cursor-default overflow-hidden ${cellStyle} ${
                            isToday ? "ring-1 ring-zinc-350 dark:ring-zinc-600 shadow-sm" : ""
                          }`}
                        >
                          <span className="absolute top-1 left-1.5 text-[9px] sm:text-[10px] font-bold opacity-70">
                            {day}
                          </span>

                          {isPresent && sessionNum !== null ? (
                            <span className="absolute bottom-0.5 right-1.5 text-sm sm:text-base font-normal tracking-tight">
                              S{sessionNum}
                            </span>
                          ) : isFrozen ? (
                            <Snowflake className="absolute bottom-1 right-1.5 w-3.5 h-3.5 opacity-80" />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {activePlan && (
          <div className="px-2 mt-2 flex justify-end">
            <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
              {new Date(activePlan.startDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })} to {new Date(activePlan.endDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
        )}
      </div>

      {/* STATUS GLOSSARY MODAL */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowInfoModal(false)}
          />
          <div className="relative w-full max-w-sm rounded-[2rem] bg-white dark:bg-zinc-900 shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-orange-50 dark:bg-brand-orange-500/10 text-brand-orange-500">
                <Info className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-55 tracking-tight">
                Status Glossary
              </h3>
            </div>

            <div className="space-y-5">
              <div className="flex gap-3">
                <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand-orange-500/20 text-brand-orange-600 dark:text-brand-orange-400 text-xs font-bold">
                  Ac
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Active</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Currently enrolled and regularly attending classes.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-250 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold">
                  In
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Inactive</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Not currently attending classes.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 text-xs font-bold">
                  Fr
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Freeze</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Membership is temporarily paused or on hold.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-xs font-bold">
                  Gr
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Grace</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Extra time provided to renew a plan before expiry.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold">
                  Ex
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Expired</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Plan has expired.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
