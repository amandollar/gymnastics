"use client";

import { useActionState, useEffect } from "react";
import { updateSessionPricingAction } from "@/lib/actions/pricing";
import type { PricingMaps } from "@/lib/plan/pricing-defaults";
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

export default function PricingRatesPanel({
  pricingMaps,
  isAdmin,
  onClose,
  onSuccess,
}: {
  pricingMaps: PricingMaps;
  isAdmin: boolean;
  onClose?: () => void;
  onSuccess?: (message: string) => void;
}) {
  const [state, action, pending] = useActionState(
    updateSessionPricingAction,
    null
  );

  useEffect(() => {
    if (state?.success) {
      onSuccess?.(state.message || "Class rates saved successfully.");
      onClose?.();
    }
  }, [state, onSuccess, onClose]);

  return (
    <div className="space-y-4">
      {isAdmin ? (
        <form action={action} className="space-y-4">
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
          {state?.message && (
            <p
              className={`text-sm ${state.success ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
            >
              {state.message}
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
              disabled={pending}
              className="rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50 cursor-pointer"
            >
              {pending ? "Saving rates…" : "Save class rates"}
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
    </div>
  );
}
