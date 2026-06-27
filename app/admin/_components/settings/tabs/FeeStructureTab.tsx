"use client";

import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { updateSessionPricingAction } from "@/lib/actions/pricing";
import type { PricingMaps } from "@/lib/services/pricing";
import { DollarSign, Info, Save } from "lucide-react";

interface FeeStructureTabProps {
  initialPricingMaps: PricingMaps;
}

export default function FeeStructureTab({ initialPricingMaps }: FeeStructureTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"REGULAR" | "ONE_TO_ONE">("REGULAR");
  const [pricing, setPricing] = useState<PricingMaps>(initialPricingMaps);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    setPricing(initialPricingMaps);
  }, [initialPricingMaps]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const daysOptions = [1, 2, 3, 4, 5, 6];

  const hasChanges = (["REGULAR", "ONE_TO_ONE"] as const).some((planType) =>
    daysOptions.some((days) => pricing[planType][days] !== initialPricingMaps[planType][days])
  );

  const handlePriceChange = (planType: "REGULAR" | "ONE_TO_ONE", days: number, value: string) => {
    const price = value === "" ? 0 : Math.max(0, parseInt(value, 10) || 0);
    setPricing((prev) => ({
      ...prev,
      [planType]: {
        ...prev[planType],
        [days]: price,
      },
    }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();

    // Populate all fields for regular and 1-on-1 plans
    // Expected keys: REGULAR_{days} and ONE_TO_ONE_{days}
    (["REGULAR", "ONE_TO_ONE"] as const).forEach((planType) => {
      daysOptions.forEach((days) => {
        const val = pricing[planType][days] ?? 0;
        formData.set(`${planType}_${days}`, val.toString());
      });
    });

    startTransition(async () => {
      const result = await updateSessionPricingAction(null, formData);
      if (result.success) {
        showToast("success", result.message || "Class rates updated.");
      } else {
        showToast("error", result.message || "Failed to update rates.");
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

      <div className="w-full">
        {/* Header inside card */}
        <div className="mb-5">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Fee & Pricing Structure
          </h2>
        </div>

        {/* Toggle between Regular & 1-on-1 */}
        <div className="flex border-b border-zinc-100 dark:border-zinc-800 mb-6">
          <button
            type="button"
            onClick={() => setActiveSubTab("REGULAR")}
            className={`pb-3 text-sm font-medium border-b-2 px-1 transition-all mr-6 cursor-pointer rounded-none ${
              activeSubTab === "REGULAR"
                ? "border-brand-orange-500 text-brand-orange-600 dark:text-brand-orange-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            Regular Plans
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("ONE_TO_ONE")}
            className={`pb-3 text-sm font-medium border-b-2 px-1 transition-all cursor-pointer rounded-none ${
              activeSubTab === "ONE_TO_ONE"
                ? "border-brand-orange-500 text-brand-orange-600 dark:text-brand-orange-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            Personal training
          </button>
        </div>
        {/* Pricing structure warning — only for Regular Plans */}
        {activeSubTab === "REGULAR" && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 mb-6 flex items-start gap-2.5">
            <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                This is the default pricing structure of grouped batches.
              </p>
              <p className="text-amber-750/80 dark:text-amber-400/80">
                To modify the plan for a particular batch, go to the{" "}
                <Link
                  href="/admin/settings?tab=batches"
                  className="font-bold underline hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
                >
                  batches
                </Link>{" "}
                page.
              </p>
              <p className="text-[11px] text-amber-700/60 dark:text-amber-500/70 pt-1.5 border-t border-amber-200/30 dark:border-amber-900/20 mt-1.5">
                The monthly fee is calculated as: <span className="font-semibold text-amber-750 dark:text-amber-300">Days per Week × 4 Weeks × Price per Session</span>
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <th className="pb-3 pt-1 px-4">Frequency</th>
                  <th className="pb-3 pt-1 px-4 text-center">Price per Session</th>
                  <th className="pb-3 pt-1 px-4 text-right">Estimated Monthly Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                {daysOptions.map((days) => {
                  const val = pricing[activeSubTab][days] ?? 0;
                  const monthlyTotal = days * 4 * val;
                  const defaultRates = activeSubTab === "REGULAR" 
                    ? { 1: 400, 2: 325, 3: 267, 4: 245, 5: 220, 6: 208 }
                    : { 1: 1100, 2: 1000, 3: 900, 4: 850, 5: 800, 6: 750 };
                  const defaultRate = defaultRates[days as keyof typeof defaultRates] ?? 0;
                  const isDefault = val === defaultRate;

                  return (
                    <tr key={days} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {days} {days === 1 ? "Day" : "Days"} per week
                        </span>
                        <span className="text-xs text-zinc-450 dark:text-zinc-500 block mt-0.5">
                          {days * 4} sessions/month
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="relative inline-block text-left">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-450 font-medium">₹</span>
                          <input
                            type="number"
                            min="0"
                            value={val === 0 ? "" : val}
                            onChange={(e) => handlePriceChange(activeSubTab, days, e.target.value)}
                            className="w-24 pl-6 pr-2.5 py-1.5 text-right rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-base md:text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/20 focus:border-brand-orange-500 transition-colors"
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                        ₹ {monthlyTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
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
              {isPending ? "Saving pricing..." : "Save Rates"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
