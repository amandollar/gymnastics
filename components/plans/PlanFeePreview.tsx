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
  const expiryStr = preview.expiryDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          {title}
        </p>
        <div className="flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          <span>{preview.validityDays}d grace</span>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <span>Expires {expiryStr}</span>
        </div>
      </div>

      {/* Line items */}
      <div className="px-4 py-3 space-y-2 text-sm">
        <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
          <span>Per class</span>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{formatINR(preview.pricePerSession)}</span>
        </div>
        <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
          <span>Classes</span>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{preview.totalSessions}</span>
        </div>

        {preview.discountPercent > 0 && (
          <>
            <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
              <span>Subtotal</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{formatINR(preview.grossFees)}</span>
            </div>
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
              <span>Discount ({preview.discountPercent}%)</span>
              <span className="font-medium">−{formatINR(preview.grossFees - preview.fee)}</span>
            </div>
          </>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Total</span>
        <span className="text-xl font-bold text-brand-orange-500">{formatINR(preview.fee)}</span>
      </div>
    </div>
  );
}
