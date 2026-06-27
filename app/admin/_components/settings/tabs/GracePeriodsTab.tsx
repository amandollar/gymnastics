"use client";

import React, { useState, useTransition, useEffect } from "react";
import { updateGracePeriodAction } from "@/lib/actions/pricing";
import {
  lookupGraceDays,
  computeDefaultGraceDays,
} from "@/lib/plan/grace-period-utils";
import type { GracePeriodMap } from "@/lib/plan/grace-period-utils";
import { Clock, Info, Save } from "lucide-react";

interface GracePeriodsTabProps {
  initialGracePeriodMap: GracePeriodMap;
}

export default function GracePeriodsTab({
  initialGracePeriodMap,
}: GracePeriodsTabProps) {
  const [map, setMap] = useState<GracePeriodMap>(initialGracePeriodMap);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    setMap(initialGracePeriodMap);
  }, [initialGracePeriodMap]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const sessionsOptions = [1, 2, 3, 4, 5, 6];
  const monthsOptions = [1, 3];

  const hasChanges = sessionsOptions.some((spw) =>
    monthsOptions.some((months) => {
      const key = `${spw}:${months}`;
      const currentVal =
        map[key] !== undefined
          ? map[key]
          : lookupGraceDays(initialGracePeriodMap, spw, months);
      const initialVal = lookupGraceDays(initialGracePeriodMap, spw, months);
      return currentVal !== initialVal;
    }),
  );

  const handleInputChange = (spw: number, months: number, value: string) => {
    const days = value === "" ? 0 : Math.max(0, parseInt(value, 10) || 0);
    const key = `${spw}:${months}`;
    setMap((prev) => ({
      ...prev,
      [key]: days,
    }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();

    // Populate form data matching expectations of updateGracePeriodAction:
    // grace_{sessionsPerWeek}_{planMonths}
    sessionsOptions.forEach((spw) => {
      monthsOptions.forEach((months) => {
        const key = `${spw}:${months}`;
        const val =
          map[key] !== undefined
            ? map[key]
            : lookupGraceDays(initialGracePeriodMap, spw, months);
        formData.set(`grace_${spw}_${months}`, val.toString());
      });
    });

    startTransition(async () => {
      const result = await updateGracePeriodAction(null, formData);
      if (result.success) {
        showToast("success", result.message || "Grace period settings saved.");
      } else {
        showToast("error", result.message || "Failed to save settings.");
      }
    });
  };

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-xl border px-4 py-3 text-sm shadow-lg max-w-sm ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40"
              : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/40"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 p-4 lg:p-6 shadow-xs md:border-0 md:bg-transparent md:p-0 md:shadow-none mb-6">
        {/* Header inside card */}
        <div className="mb-5">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Grace Periods
          </h2>
        </div>

        <div className="flex items-center gap-2 mb-6 text-xs text-amber-600 dark:text-amber-400">
          <Info className="h-3.5 w-3.5 shrink-0 text-amber-500 dark:text-amber-455" />
          <p className="font-medium">
            Grace days extend the student plan expiry date (Grace Deadline = End Date + Grace Days). Auto-expires when sessions complete.
          </p>
        </div>

        <form onSubmit={handleSave}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <th className="pb-3 pt-1 px-4">Frequency</th>
                  <th className="pb-3 pt-1 px-4 text-center">
                    1-Month Plan Grace (Days)
                  </th>
                  <th className="pb-3 pt-1 px-4 text-center">
                    3-Month Plan Grace (Days)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                {sessionsOptions.map((spw) => (
                  <tr
                    key={spw}
                    className="hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {spw} {spw === 1 ? "Session" : "Sessions"}
                      </span>
                      <span className="text-xs text-zinc-450 dark:text-zinc-500 block mt-0.5">
                        per week
                      </span>
                    </td>
                    {monthsOptions.map((months) => {
                      const key = `${spw}:${months}`;
                      const val =
                        map[key] !== undefined
                          ? map[key]
                          : lookupGraceDays(initialGracePeriodMap, spw, months);
                      const defaultVal = computeDefaultGraceDays(spw, months);
                      const isDefault = val === defaultVal;

                      return (
                        <td key={months} className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-2.5">
                            <input
                              type="number"
                              min="0"
                              max="90"
                              value={
                                val === 0 && map[key] === undefined ? "" : val
                              }
                              onChange={(e) =>
                                handleInputChange(spw, months, e.target.value)
                              }
                              className="w-20 text-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 text-base md:text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500 transition-colors"
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="submit"
              disabled={isPending || !hasChanges}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
            >
              <Save className="h-4 w-4" />
              {isPending ? "Saving changes..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
