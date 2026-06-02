"use client";

import { useActionState } from "react";
import { updateSessionPricingAction } from "@/lib/actions/pricing";
import type { PricingMaps } from "@/lib/plan/pricing-defaults";
import { formatINR } from "@/lib/utils/student";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500";

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
      <p className="px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-150 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
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
                <span className="text-zinc-450 dark:text-zinc-500">₹</span>
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
}: {
  pricingMaps: PricingMaps;
  isAdmin: boolean;
}) {
  const [state, action, pending] = useActionState(
    updateSessionPricingAction,
    null
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        Each row is the price for <strong className="text-zinc-800">one class</strong>,
        based on how many days per week the student comes. Create & assign uses
        these rates automatically.
      </p>

      {isAdmin ? (
        <form action={action} className="space-y-4">
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            As admin you can change rates below. Saved prices apply to new
            calculations immediately.
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <RatesTable
              title="Regular group classes"
              planType="REGULAR"
              prices={pricingMaps.REGULAR}
              isAdmin
              editMode
            />
            <RatesTable
              title="1-to-1 private classes"
              planType="ONE_TO_ONE"
              prices={pricingMaps.ONE_TO_ONE}
              isAdmin
              editMode
            />
          </div>
          {state?.message && (
            <p
              className={`text-sm ${state.success ? "text-emerald-600" : "text-rose-600"}`}
            >
              {state.message}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
          >
            {pending ? "Saving rates…" : "Save class rates"}
          </button>
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
              title="1-to-1 private classes"
              planType="ONE_TO_ONE"
              prices={pricingMaps.ONE_TO_ONE}
              isAdmin={false}
              editMode={false}
            />
          </div>
          <p className="text-xs text-zinc-500">
            Only an admin can change these rates. Contact your admin if prices need updating.
          </p>
        </>
      )}
    </div>
  );
}
