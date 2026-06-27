import React from "react";

export function OverviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Month selector skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full shrink-0" />
        ))}
      </div>

      {/* KPI Summary skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm h-[94px]" />
        ))}
      </div>

      {/* Charts Section skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Breakdown */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900/60 shadow-sm h-72" />
        {/* Income Sources */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900/60 shadow-sm h-72" />
      </div>

      {/* Cashflow Overview skeleton */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900/60 shadow-sm h-96" />
    </div>
  );
}

export function TransactionsSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm overflow-x-auto animate-pulse">
      <div className="space-y-4">
        <div className="h-6 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        <div className="w-full border-t border-zinc-250 dark:border-zinc-800 pt-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BudgetSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-6 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        <div className="h-9 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
      </div>
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm h-96" />
    </div>
  );
}
