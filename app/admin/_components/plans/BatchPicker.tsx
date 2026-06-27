"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Users, Info, X } from "lucide-react";
import type { BatchWithCount } from "@/lib/services/batches";
import type { PlanStudentOption } from "./StudentPicker";
import type { PricingMaps } from "@/lib/plan/pricing-defaults";
import StudentAvatar from "@/app/admin/_components/students/StudentAvatar";

export default function BatchPicker({
  batches = [],
  value,
  onChange,
  error,
  studentAge,
  students = [],
  pricingMaps,
}: {
  batches?: BatchWithCount[];
  value: string;
  onChange: (batchId: string) => void;
  error?: string;
  studentAge?: number | null;
  students?: PlanStudentOption[];
  pricingMaps?: PricingMaps;
}) {
  const [infoBatchId, setInfoBatchId] = useState<string | null>(null);

  const WEEKDAYS = [
    { key: "Monday",    short: "Mon" },
    { key: "Tuesday",   short: "Tue" },
    { key: "Wednesday", short: "Wed" },
    { key: "Thursday",  short: "Thu" },
    { key: "Friday",    short: "Fri" },
    { key: "Saturday",  short: "Sat" },
    { key: "Sunday",    short: "Sun" },
  ];

  const infoBatch = batches.find((b) => b.id === infoBatchId);

  return (
    <div className="space-y-2.5">
      {batches.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {batches.map((b) => {
            const selected = b.id === value;
            const isAgeInvalid = !selected && studentAge !== undefined && studentAge !== null && (
              studentAge < (b.startAge ?? 0) || studentAge > (b.endAge ?? 99)
            );

            if (isAgeInvalid) {
              return (
                <div
                  key={b.id}
                  className="relative flex items-center justify-between rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-850/10 px-4 py-2.5 opacity-60 select-none min-h-[3.25rem]"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-450 dark:text-zinc-500 truncate">
                      {b.name}
                    </p>
                    <span className="shrink-0 text-[10px] bg-zinc-150 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md text-zinc-500 dark:text-zinc-400 font-bold">
                      Age {b.startAge}–{b.endAge}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-bold">
                      Age mismatch
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setInfoBatchId(b.id);
                      }}
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-zinc-450 hover:text-zinc-655 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="View batch details"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={b.id}
                role="button"
                onClick={() => onChange(b.id)}
                className={`
                  relative flex flex-col gap-1.5 rounded-3xl border px-4 py-3.5 text-left transition-all cursor-pointer
                  ${
                    selected
                      ? "border-brand-orange-500 bg-brand-orange-50/60 dark:bg-brand-orange-950/20"
                      : "border-zinc-200 dark:border-zinc-800/60 bg-zinc-50/60 dark:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
                  }
                `}
                aria-pressed={selected}
              >
                {/* Selection indicator */}
                <span
                  className={`absolute top-3 right-3 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    selected
                      ? "border-brand-orange-500 bg-brand-orange-500"
                      : "border-zinc-300 dark:border-zinc-600"
                  }`}
                >
                  {selected && (
                    <span className="block h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>

                {/* Info button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setInfoBatchId(b.id);
                  }}
                  className="absolute top-2.5 right-9 h-5 w-5 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-650 hover:bg-zinc-150/80 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="View batch details"
                >
                  <Info className="h-4 w-4" />
                </button>

                <p
                  className={`text-sm font-semibold pr-12 leading-snug ${
                    selected
                      ? "text-brand-orange-700 dark:text-brand-orange-300"
                      : "text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {b.name}
                </p>
                <div className="flex flex-col gap-1.5 mt-1.5 w-full">
                  <div className="flex items-center gap-1.5">
                    <Clock
                      className={`h-3.5 w-3.5 shrink-0 ${
                        selected ? "text-brand-orange-500" : "text-zinc-400"
                      }`}
                    />
                    <span
                      className={`text-xs ${
                        selected
                          ? "text-brand-orange-600 dark:text-brand-orange-400"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {b.timing}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs ${
                        selected
                          ? "text-brand-orange-600 dark:text-brand-orange-400"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      Age limit: <span className="font-semibold">{b.startAge}–{b.endAge} years</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users
                      className={`h-3.5 w-3.5 shrink-0 ${
                        selected ? "text-brand-orange-500" : "text-zinc-400"
                      }`}
                    />
                    <div
                      className={`text-xs flex items-center gap-1.5 flex-wrap ${
                        selected
                          ? "text-brand-orange-600 dark:text-brand-orange-400"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      <span className={`font-semibold ${selected ? "text-brand-orange-700 dark:text-brand-orange-300" : "text-zinc-700 dark:text-zinc-300"}`}>
                        {b.activeCount ?? 0}
                      </span>
                      <span className="opacity-90">active</span>
                      <span className="opacity-30 select-none">|</span>
                      <span className={`font-semibold ${selected ? "text-brand-orange-700 dark:text-brand-orange-300" : "text-zinc-700 dark:text-zinc-300"}`}>
                        {b.graceCount ?? 0}
                      </span>
                      <span className="opacity-90">grace</span>
                      <span className="opacity-30 select-none">|</span>
                      <span className={`font-semibold ${selected ? "text-brand-orange-700 dark:text-brand-orange-300" : "text-zinc-700 dark:text-zinc-300"}`}>
                        {b.inactiveCount ?? 0}
                      </span>
                      <span className="opacity-90">inactive</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
          <span className="inline-block h-3.5 w-3.5 rounded-full border border-rose-500 flex items-center justify-center text-[9px] font-bold shrink-0">
            !
          </span>
          {error}
        </p>
      )}

      {/* Batch Details Modal */}
      {infoBatch && (() => {
        const rates = infoBatch.useDefaultPricing
          ? pricingMaps?.REGULAR ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
          : {
              1: infoBatch.price1d ?? 0,
              2: infoBatch.price2d ?? 0,
              3: infoBatch.price3d ?? 0,
              4: infoBatch.price4d ?? 0,
              5: infoBatch.price5d ?? 0,
              6: infoBatch.price6d ?? 0,
            };

        const batchStudents = students.filter(
          (s) => s.activePlan?.batchId === infoBatch.id
        );

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setInfoBatchId(null)}
          >
            <div
              className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-6 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {infoBatch.name}
                    </h3>
                    {infoBatch.useDefaultPricing ? (
                      <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Default
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-brand-orange-655 bg-brand-orange-50 dark:text-brand-orange-400 dark:bg-brand-orange-950/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {infoBatch.timing}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInfoBatchId(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-655 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
                {/* Pricing distribution per class */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Class Rates (Per Session)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((d) => (
                      <div
                        key={d}
                        className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 rounded-xl py-2 px-1 text-center"
                      >
                        <div className="text-[10px] font-semibold text-zinc-400">
                          {d}d/wk
                        </div>
                        <div className="text-xs font-bold text-zinc-700 dark:text-zinc-200 mt-0.5">
                          ₹{(rates as any)[d]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Day attendance strip */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Class Days
                  </p>
                  <div className="flex items-center gap-0.5">
                    {WEEKDAYS.map(({ key, short }) => {
                      const cnt = (infoBatch.dayCounts as any)?.[key] ?? 0;
                      const active = cnt > 0;
                      return (
                        <div
                          key={key}
                          className={`flex-1 flex flex-col items-center py-2 rounded-lg ${
                            active
                              ? "bg-brand-orange-50 dark:bg-brand-orange-950/30"
                              : "bg-zinc-100/60 dark:bg-zinc-800/40"
                          }`}
                        >
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wide ${
                              active
                                ? "text-brand-orange-500 dark:text-brand-orange-400"
                                : "text-zinc-400 dark:text-zinc-500"
                            }`}
                          >
                            {short.slice(0, 1)}
                          </span>
                          <span
                            className={`text-xs font-bold mt-0.5 ${
                              active
                                ? "text-brand-orange-655 dark:text-brand-orange-300"
                                : "text-zinc-400 dark:text-zinc-600"
                            }`}
                          >
                            {cnt > 0 ? cnt : "–"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Enrolled students list */}
                <div className="space-y-2 flex flex-col">
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Enrolled Students ({batchStudents.length})
                  </p>
                  <div className="overflow-y-auto max-h-[220px] rounded-2xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/20 dark:bg-zinc-950/20 divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {batchStudents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
                        <Users className="h-6 w-6 mb-1.5 stroke-1" />
                        <p className="text-xs font-medium">No students in this batch</p>
                      </div>
                    ) : (
                      batchStudents.map((student) => {
                        const assignedDays: string[] = Array.isArray(
                          student.activePlan?.selectedDays
                        )
                          ? student.activePlan.selectedDays
                          : [];
                        const dayLabels = WEEKDAYS
                          .filter(({ key }) => assignedDays.includes(key))
                          .map(({ short }) => short)
                          .join(", ");

                        return (
                          <Link
                            key={student.id}
                            href={`/admin/students/${student.id}`}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors group block"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <StudentAvatar
                                student={{
                                  id: student.id,
                                  name: student.name,
                                  studentNumber: student.studentNumber,
                                  gender: student.gender,
                                  avatarUrl: student.avatarUrl,
                                }}
                                size={32}
                                className="shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-brand-orange-500 dark:group-hover:text-brand-orange-400 transition-colors truncate leading-tight">
                                  {student.name}
                                </p>
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                                  #{student.studentNumber}
                                  {dayLabels ? ` · ${dayLabels}` : ""}
                                </p>
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end bg-zinc-50/50 dark:bg-zinc-950/20">
                <button
                  type="button"
                  onClick={() => setInfoBatchId(null)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-655 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
