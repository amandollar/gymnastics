import React from "react";

export default function AttendanceLoading() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-pulse">
      {/* Legend Skeleton */}
      <div className="h-16 rounded-[1.25rem] bg-zinc-100/50 dark:bg-zinc-900/40" />

      {/* Calendar Months Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-[1.25rem] p-3.5 border border-zinc-200/60 dark:border-zinc-800/80 h-72 space-y-4">
            <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md mx-auto animate-pulse" />
            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, idx) => (
                <div key={idx} className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
