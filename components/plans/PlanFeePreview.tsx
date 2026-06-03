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
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 p-4 text-sm space-y-2">
      <p className="font-medium text-zinc-900 dark:text-zinc-100">{title}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <dt className="text-zinc-500 dark:text-zinc-400">Sessions/week</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
          {preview.sessionsPerWeek}
        </dd>
        <dt className="text-zinc-500 dark:text-zinc-400">Total sessions</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
          {preview.totalSessions}
        </dd>
        <dt className="text-zinc-500 dark:text-zinc-400">Price per class</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
          {formatINR(preview.pricePerSession)}
        </dd>
        <dt className="text-zinc-500 dark:text-zinc-400">Gross fees</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
          {formatINR(preview.grossFees)}
        </dd>
        <dt className="text-zinc-500 dark:text-zinc-400">Discount</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
          {preview.discountPercent}%
        </dd>
        <dt className="text-zinc-500 dark:text-zinc-400">Final price</dt>
        <dd className="font-semibold text-brand-orange-655 dark:text-brand-orange-500 text-right">
          {formatINR(preview.fee)}
        </dd>
        <dt className="text-zinc-500 dark:text-zinc-400">Grace days</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
          {preview.validityDays}
        </dd>
        <dt className="text-zinc-500 dark:text-zinc-400">Expiry date</dt>
        <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
          {preview.expiryDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </dd>
      </dl>
    </div>
  );
}
