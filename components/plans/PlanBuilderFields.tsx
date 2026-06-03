"use client";

import { useMemo } from "react";
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
    <div className="space-y-5">
      {formMode && (
        <input type="hidden" name="planType" value={planType} readOnly />
      )}

      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Class type</p>
        <div className="inline-flex rounded-full p-1 bg-zinc-100 dark:bg-zinc-800">
          {(["REGULAR", "ONE_TO_ONE"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onPlanTypeChange(t)}
              className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors cursor-pointer ${
                planType === t
                  ? "bg-brand-orange-500 text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {t === "REGULAR" ? "Regular group" : "1-to-1 personal classes"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">How long is the plan?</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {(
            [
              { label: "1 month", months: 1 as const },
              { label: "3 months", months: 3 as const },
            ] as const
          ).map(({ label, months }) => {
            const isActive = activePlanMonths === months;
            return (
              <button
                key={label}
                type="button"
                onClick={() => applyDuration(months)}
                disabled={!startDate}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isActive
                    ? "bg-brand-orange-500 text-white shadow-sm"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Start date</label>
            <input
              name={formMode ? "startDate" : undefined}
              type="date"
              required={formMode}
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className={planInputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">End date</label>
            <input
              name={formMode ? "endDate" : undefined}
              type="date"
              required={formMode}
              min={startDate}
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className={planInputClass}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Which days do they attend?
          <span className="font-normal text-zinc-500 dark:text-zinc-400">
            {" "}
            — {selectedDays.length} day{selectedDays.length === 1 ? "" : "s"} per week
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {PLAN_DAY_OPTIONS.map(({ short, name }) => {
            const on = selectedDays.includes(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => onToggleDay(name)}
                className={`min-w-[2.75rem] rounded-full px-3.5 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                  on
                    ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm"
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
          <p className="mt-1 text-xs text-rose-600">{selectedDaysError}</p>
        )}
      </div>

      <div>
        <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Discount (optional)</label>
        <div className="flex items-center gap-2">
          <input
            name={formMode ? "discountPercent" : undefined}
            type="number"
            min={0}
            max={100}
            value={discountPercent}
            onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
            className={`${planInputClass} max-w-[100px]`}
          />
          <span className="text-sm text-zinc-500 dark:text-zinc-450">%</span>
        </div>
      </div>

      {preview ? (
        <PlanFeePreview preview={preview} title="Total fee for this plan" />
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/40 px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Choose dates and at least one class day to see sessions and total fee.
        </div>
      )}
    </div>
  );
}
