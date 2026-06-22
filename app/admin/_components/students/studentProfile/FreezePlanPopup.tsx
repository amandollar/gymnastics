"use client";

import { useState, useEffect, useMemo, useActionState } from "react";
import { toDateInputValue } from "@/lib/utils/student";
import { addFreezePeriodAction, unfreezePlanAction } from "@/lib/actions/plans";
import type { PlanRow } from "./types";
import { getFreezeDaysCount } from "./types";

// ─── Unfreeze Button ──────────────────────────────────────────────────────────

export function UnfreezeButton({
  planId,
  studentId,
  variant = "button",
  onSuccess,
}: {
  planId: string;
  studentId: string;
  variant?: "button" | "dropdown";
  onSuccess?: () => void;
}) {
  const [state, action, pending] = useActionState(unfreezePlanAction, null);

  useEffect(() => {
    if (state?.success && onSuccess) {
      onSuccess();
    }
  }, [state?.success, onSuccess]);

  if (variant === "dropdown") {
    return (
      <form action={action} className="w-full">
        <input type="hidden" name="studentPlanId" value={planId} />
        <input type="hidden" name="studentId" value={studentId} />
        <button
          type="submit"
          disabled={pending}
          className="w-full text-left px-3.5 py-2 text-xs font-medium text-sky-650 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/20 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
          {pending ? "Unfreezing…" : "Unfreeze"}
        </button>
        {state?.message && !state.success && (
          <p className="text-[10px] text-rose-600 px-3.5 mt-1">{state.message}</p>
        )}
      </form>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="studentPlanId" value={planId} />
      <input type="hidden" name="studentId" value={studentId} />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-xl border border-sky-300 dark:border-sky-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors cursor-pointer disabled:opacity-50"
      >
        {pending ? "Removing…" : "Unfreeze"}
      </button>
      {state?.message && !state.success && (
        <p className="text-xs text-rose-600 mt-1">{state.message}</p>
      )}
    </form>
  );
}

// ─── Freeze Plan Popup ────────────────────────────────────────────────────────

export function FreezePlanPopup({
  activePlan,
  studentId,
  onClose,
}: {
  activePlan: PlanRow;
  studentId: string;
  onClose: () => void;
}) {
  const today = toDateInputValue(new Date());
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [state, action, pending] = useActionState(addFreezePeriodAction, null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state?.success, onClose]);

  // Compute duration (inclusive of start and end dates)
  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    const diffTime = e.getTime() - s.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  // Frontend validations
  const validationError = useMemo(() => {
    if (!startDate || !endDate) return null;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;

    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);

    if (e < s) {
      return "End date must be after or equal to start date";
    }

    // Plan boundaries
    const pStart = new Date(activePlan.startDate);
    const pEnd = new Date(activePlan.endDate);
    pStart.setHours(0, 0, 0, 0);
    pEnd.setHours(0, 0, 0, 0);

    if (s < pStart || e > pEnd) {
      return `Freeze dates must be within plan active window (${pStart.toLocaleDateString("en-IN")} to ${pEnd.toLocaleDateString("en-IN")})`;
    }

    // Overlaps with new freezePeriods relation
    if (activePlan.freezePeriods && activePlan.freezePeriods.length > 0) {
      for (const fp of activePlan.freezePeriods) {
        const existingStart = new Date(fp.startDate);
        const existingEnd = new Date(fp.endDate);
        existingStart.setHours(0, 0, 0, 0);
        existingEnd.setHours(0, 0, 0, 0);

        if (s <= existingEnd && e >= existingStart) {
          return `Overlaps with an existing freeze period (${existingStart.toLocaleDateString("en-IN")} to ${existingEnd.toLocaleDateString("en-IN")})`;
        }
      }
    } else if (activePlan.freezeStartDate && activePlan.freezeEndDate) {
      // Legacy freeze period check
      const existingStart = new Date(activePlan.freezeStartDate);
      const existingEnd = new Date(activePlan.freezeEndDate);
      existingStart.setHours(0, 0, 0, 0);
      existingEnd.setHours(0, 0, 0, 0);

      if (s <= existingEnd && e >= existingStart) {
        return `Overlaps with legacy freeze period (${existingStart.toLocaleDateString("en-IN")} to ${existingEnd.toLocaleDateString("en-IN")})`;
      }
    }

    return null;
  }, [startDate, endDate, activePlan]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4 animate-menu-show">
        <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            ❄️ Freeze Plan
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Already added freeze plans list */}
        {((activePlan.freezePeriods && activePlan.freezePeriods.length > 0) ||
          (activePlan.freezeStartDate && activePlan.freezeEndDate)) && (
          <div className="space-y-2 max-h-32 overflow-y-auto pr-1 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1">
              Existing Freeze Periods
            </span>
            <div className="space-y-1.5">
              {(!activePlan.freezePeriods || activePlan.freezePeriods.length === 0) &&
                activePlan.freezeStartDate &&
                activePlan.freezeEndDate && (
                  <div key="legacy" className="flex items-center justify-between text-xs bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-100/50 dark:border-zinc-800/40">
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {new Date(activePlan.freezeStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} → {new Date(activePlan.freezeEndDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                      {getFreezeDaysCount(activePlan.freezeStartDate, activePlan.freezeEndDate)} days
                    </span>
                  </div>
                )}
              {activePlan.freezePeriods &&
                activePlan.freezePeriods.map((fp) => (
                  <div key={fp.id} className="flex items-center justify-between text-xs bg-zinc-50 dark:bg-zinc-955 px-2.5 py-1.5 rounded-lg border border-zinc-100/50 dark:border-zinc-800/40">
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {new Date(fp.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} → {new Date(fp.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                      {getFreezeDaysCount(fp.startDate, fp.endDate)} days
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <form action={action} className="space-y-4">
          <input type="hidden" name="studentPlanId" value={activePlan.id} />
          <input type="hidden" name="studentId" value={studentId} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Start Date
              </label>
              <input
                name="freezeStartDate"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                End Date
              </label>
              <input
                name="freezeEndDate"
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          <div className="rounded-xl bg-sky-50/50 dark:bg-sky-950/20 px-3.5 py-2 border border-sky-100/50 dark:border-sky-900/20 flex justify-between items-center text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Duration:</span>
            <span className="font-bold text-sky-700 dark:text-sky-400">
              {days > 0 ? `${days} day${days > 1 ? "s" : ""}` : "Invalid range"}
            </span>
          </div>

          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
            The plan end date and grace deadline will be extended by the freeze duration.
          </p>

          {validationError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium leading-relaxed">
              ⚠️ {validationError}
            </p>
          )}

          {state?.message && !state.success && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{state.message}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || days <= 0 || !!validationError}
              className="flex-1 rounded-xl bg-sky-600 hover:bg-sky-700 px-3 py-2 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {pending ? "Freezing…" : "Apply freeze"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
