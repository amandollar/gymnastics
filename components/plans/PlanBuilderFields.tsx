"use client";

import { useMemo } from "react";
import { Calendar } from "lucide-react";
import type { PlanComputeResult, PlanTypeKey, WeekdayName } from "@/lib/plan/calculations";
import { endDateForPlanMonths } from "@/lib/plan/plan-period";
import { parseDateInput } from "@/lib/utils/student";
import { PLAN_DAY_OPTIONS, planInputClass } from "./plan-form-shared";
import PlanFeePreview from "./PlanFeePreview";

type Props = {
  planType: PlanTypeKey;
  onPlanTypeChange: (t: PlanTypeKey) => void;
  startDate: string;
  onStartDateChange: (v: string) => void;
  endDate: string;
  onEndDateChange: (v: string) => void;
  selectedDays: WeekdayName[];
  onToggleDay: (day: WeekdayName) => void;
  discountPercent: number;
  onDiscountChange: (n: number) => void;
  preview: PlanComputeResult | null;
  formMode?: boolean;
  selectedDaysError?: string;
};

export default function PlanBuilderFields({
  planType,
  onPlanTypeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  selectedDays,
  onToggleDay,
  discountPercent,
  onDiscountChange,
  preview,
  formMode = false,
  selectedDaysError,
}: Props) {
  function applyDuration(months: 1 | 3) {
    if (!startDate) return;
    onEndDateChange(endDateForPlanMonths(startDate, months));
  }

  const activePlanMonths = useMemo(() => {
    if (!startDate || !endDate) return null;
    try {
      const start = parseDateInput(startDate);
      const end = parseDateInput(endDate);
      const ms = end.getTime() - start.getTime();
      const diffDays = Math.round(ms / 86400000);
      return diffDays <= 31 ? 1 : diffDays <= 93 ? 3 : null;
    } catch {
      return null;
    }
  }, [startDate, endDate]);

  return (
    <div className="space-y-8">
      {formMode && (
        <input type="hidden" name="planType" value={planType} readOnly />
      )}

      {/* Plan type toggle */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Plan type
        </label>
        <div className="inline-flex rounded-2xl p-1 bg-zinc-100 dark:bg-zinc-800">
          {(["REGULAR", "ONE_TO_ONE"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onPlanTypeChange(t)}
              className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                planType === t
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              {t === "REGULAR" ? "Group class" : "1-to-1 personal"}
            </button>
          ))}
        </div>
      </div>

      {/* Date range grid */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Start date
          </label>
          <div className="relative">
            <input
              name={formMode ? "startDate" : undefined}
              type="date"
              required={formMode}
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className={`${planInputClass} pr-9 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
            />
            <Calendar className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              End date
            </label>
            {/* Quick-pick duration shortcuts */}
            <div className="flex items-center gap-1.5">
              {([1, 3] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => applyDuration(m)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    activePlanMonths === m
                      ? "bg-brand-orange-500 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {m}mo
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <input
              name={formMode ? "endDate" : undefined}
              type="date"
              required={formMode}
              min={startDate}
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className={`${planInputClass} pr-9 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
            />
            <Calendar className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Day picker */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Class days
          </label>
          {selectedDays.length > 0 && (
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
              {selectedDays.length}× per week
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {PLAN_DAY_OPTIONS.map(({ short, name }) => {
            const on = selectedDays.includes(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => onToggleDay(name)}
                className={`min-w-[3.25rem] rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                  on
                    ? "bg-brand-orange-500 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {short}
              </button>
            );
          })}
        </div>
        {formMode &&
          selectedDays.map((d) => (
            <input key={d} type="hidden" name="selectedDays" value={d} />
          ))}
        {selectedDaysError && (
          <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{selectedDaysError}</p>
        )}
      </div>

      {/* Discount */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Discount
        </label>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              name={formMode ? "discountPercent" : undefined}
              type="number"
              min={0}
              max={100}
              value={discountPercent}
              onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
              className={`${planInputClass} max-w-[96px] pr-7`}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 dark:text-zinc-500 pointer-events-none">%</span>
          </div>
          {discountPercent > 0 && (
            <button
              type="button"
              onClick={() => onDiscountChange(0)}
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Fee preview */}
      {preview ? (
        <PlanFeePreview preview={preview} title="Fee summary" />
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 px-4 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
          Pick dates and at least one class day to see sessions & total fee
        </div>
      )}
    </div>
  );
}
