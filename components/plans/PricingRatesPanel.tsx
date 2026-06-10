"use client";

import { useActionState, useEffect, useState } from "react";
import { updateSessionPricingAction, updateGracePeriodAction } from "@/lib/actions/pricing";
import type { PricingMaps } from "@/lib/plan/pricing-defaults";
import type { GracePeriodMap } from "@/lib/plan/grace-period-utils";
import { computeDefaultGraceDays } from "@/lib/plan/grace-period-utils";
import { formatINR } from "@/lib/utils/student";

const inputClass =
  "w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-right text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500";

function RatesTable({
  title,
  planType,
  prices,
  isAdmin,
  editMode,
}: {
  title: string;
  planType: "REGULAR" | "ONE_TO_ONE";
  prices: Record<number, number>;
  isAdmin: boolean;
  editMode: boolean;
}) {
  return (
    <div className="rounded-xl border-0 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
      <p className="px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        {title}
      </p>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
        {[1, 2, 3, 4, 5, 6].map((days) => (
          <li key={days} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="text-zinc-600 dark:text-zinc-400 shrink-0">
              {days} day{days > 1 ? "s" : ""} per week
            </span>
            {editMode && isAdmin ? (
              <div className="flex items-center gap-1.5 max-w-[140px]">
                <span className="text-zinc-400 dark:text-zinc-500">₹</span>
                <input
                  name={`${planType}_${days}`}
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={prices[days]}
                  className={inputClass}
                  required
                />
              </div>
            ) : (
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {formatINR(prices[days])} / class
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Grace period settings table — editable by admin.
 * Rows: sessionsPerWeek 1–4
 * Columns: 1-month plan, 3-month plan
 */
function GracePeriodTable({
  gracePeriodMap,
  isAdmin,
  editMode,
}: {
  gracePeriodMap: GracePeriodMap;
  isAdmin: boolean;
  editMode: boolean;
}) {
  const spwLabels: Record<number, string> = {
    1: "1 class/week",
    2: "2 classes/week",
    3: "3 classes/week",
    4: "4 classes/week",
  };

  function getDays(spw: number, months: number): number {
    const key = `${spw}:${months}`;
    return key in gracePeriodMap
      ? gracePeriodMap[key]
      : computeDefaultGraceDays(spw, months);
  }

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
      <p className="px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        Grace period after plan ends
      </p>

      {/* Header row */}
      <div className="grid grid-cols-3 px-4 py-2 bg-zinc-50/60 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
        <span>Plan frequency</span>
        <span className="text-center">1-month plan</span>
        <span className="text-center">3-month plan</span>
      </div>

      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
        {[1, 2, 3, 4].map((spw) => (
          <li key={spw} className="grid grid-cols-3 items-center gap-3 px-4 py-2.5">
            <span className="text-zinc-600 dark:text-zinc-400 text-xs">
              {spwLabels[spw]}
            </span>
            {[1, 3].map((months) => (
              <div key={months} className="flex justify-center">
                {editMode && isAdmin ? (
                  <div className="flex items-center gap-1 max-w-[100px]">
                    <input
                      name={`grace_${spw}_${months}`}
                      type="number"
                      min={0}
                      max={60}
                      step={1}
                      defaultValue={getDays(spw, months)}
                      className={`${inputClass} text-center`}
                    />
                    <span className="text-xs text-zinc-400 shrink-0">d</span>
                  </div>
                ) : (
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm tabular-nums">
                    {getDays(spw, months) === 0 ? (
                      <span className="text-zinc-400 text-xs font-normal">No grace</span>
                    ) : (
                      `${getDays(spw, months)} days`
                    )}
                  </span>
                )}
              </div>
            ))}
          </li>
        ))}
      </ul>

      <p className="px-4 py-2.5 text-[10px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/20">
        Formula default: sessions/week × plan months × 2. Override per row above.
      </p>
    </div>
  );
}

type Tab = "pricing" | "grace";

export default function PricingRatesPanel({
  pricingMaps,
  gracePeriodMap,
  isAdmin,
  onClose,
  onSuccess,
}: {
  pricingMaps: PricingMaps;
  gracePeriodMap: GracePeriodMap;
  isAdmin: boolean;
  onClose?: () => void;
  onSuccess?: (message: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("pricing");

  const [pricingState, pricingAction, pricingPending] = useActionState(
    updateSessionPricingAction,
    null
  );
  const [graceState, graceAction, gracePending] = useActionState(
    updateGracePeriodAction,
    null
  );

  useEffect(() => {
    if (pricingState?.success) {
      onSuccess?.(pricingState.message || "Class rates saved successfully.");
      onClose?.();
    }
  }, [pricingState, onSuccess, onClose]);

  useEffect(() => {
    if (graceState?.success) {
      onSuccess?.(graceState.message || "Grace period settings saved.");
      onClose?.();
    }
  }, [graceState, onSuccess, onClose]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "pricing", label: "Class Rates" },
    { id: "grace", label: "Grace Periods" },
  ];

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl p-1 bg-zinc-100 dark:bg-zinc-800 w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Class Rates Tab */}
      {activeTab === "pricing" && (
        <>
          {isAdmin ? (
            <form action={pricingAction} className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <RatesTable
                  title="Regular group classes"
                  planType="REGULAR"
                  prices={pricingMaps.REGULAR}
                  isAdmin
                  editMode
                />
                <RatesTable
                  title="1-to-1 personal classes"
                  planType="ONE_TO_ONE"
                  prices={pricingMaps.ONE_TO_ONE}
                  isAdmin
                  editMode
                />
              </div>
              {pricingState?.message && (
                <p
                  className={`text-sm ${pricingState.success ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                >
                  {pricingState.message}
                </p>
              )}
              <div className="flex items-center justify-end gap-2 pt-4 mt-4 shrink-0">
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                )}
                <button
                  type="submit"
                  disabled={pricingPending}
                  className="rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50 cursor-pointer"
                >
                  {pricingPending ? "Saving rates…" : "Save class rates"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <RatesTable
                  title="Regular group classes"
                  planType="REGULAR"
                  prices={pricingMaps.REGULAR}
                  isAdmin={false}
                  editMode={false}
                />
                <RatesTable
                  title="1-to-1 personal classes"
                  planType="ONE_TO_ONE"
                  prices={pricingMaps.ONE_TO_ONE}
                  isAdmin={false}
                  editMode={false}
                />
              </div>
              {onClose && (
                <div className="flex items-center justify-end pt-4 mt-4 shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Grace Periods Tab */}
      {activeTab === "grace" && (
        <>
          {isAdmin ? (
            <form action={graceAction} className="space-y-4">
              <GracePeriodTable
                gracePeriodMap={gracePeriodMap}
                isAdmin
                editMode
              />
              {graceState?.message && (
                <p
                  className={`text-sm ${graceState.success ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                >
                  {graceState.message}
                </p>
              )}
              <div className="flex items-center justify-end gap-2 pt-4 mt-4 shrink-0">
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                )}
                <button
                  type="submit"
                  disabled={gracePending}
                  className="rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50 cursor-pointer"
                >
                  {gracePending ? "Saving…" : "Save grace periods"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <GracePeriodTable
                gracePeriodMap={gracePeriodMap}
                isAdmin={false}
                editMode={false}
              />
              {onClose && (
                <div className="flex items-center justify-end pt-4 mt-4 shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
