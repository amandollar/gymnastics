"use client";

import type { PlanComputeResult } from "@/lib/plan/calculations";
import { formatINR } from "@/lib/utils/student";

export default function PlanFeePreview({
  preview,
  title = "Fee preview",
}: {
  preview: PlanComputeResult;
  title?: string;
}) {
  const endDateStr = preview.expiryDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const graceDays = preview.graceDays;

  return (
    <div className="space-y-6 select-none">
      {/* Expiry and Grace Periods Row */}
      <div className="space-y-3">
        {graceDays > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">
              Grace Period
            </span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
              {graceDays} days
            </span>
          </div>
        )}
        <div className="flex justify-between items-center text-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">
            Plan Expiry
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {endDateStr}
            </span>
            {graceDays > 0 && (
              <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30 uppercase tracking-wide">
                inc. grace
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Fee Summary */}
      <div className="space-y-3.5 pt-4 border-t border-zinc-150 dark:border-zinc-800/80">
        {/* Header row */}
        <div className="flex items-center justify-between pb-1">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {title}
          </p>
        </div>

        {/* Line items */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Per class fee</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {formatINR(preview.pricePerSession)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Total sessions</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {preview.totalSessions} classes
            </span>
          </div>

          {preview.discountPercent > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Subtotal</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatINR(preview.grossFees)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 dark:text-emerald-450 font-medium">Discount</span>
                  <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-900/10">
                    {preview.discountPercent}%
                  </span>
                </div>
                <span className="font-semibold text-emerald-650 dark:text-emerald-450">
                  −{formatINR(preview.grossFees - preview.fee)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between items-baseline pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Total amount
          </span>
          <span className="text-2xl font-black text-brand-orange-500 dark:text-brand-orange-400 tracking-tight">
            {formatINR(preview.fee)}
          </span>
        </div>
      </div>
    </div>
  );
}
