import React from "react";

export default function Loading() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-pulse">
      {/* Profile Header Skeleton */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/40 h-24">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-2">
            <div className="h-6 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Main card skeleton */}
      <div className="h-56 rounded-[2rem] bg-zinc-100/50 dark:bg-zinc-900/40 p-6 space-y-4">
        <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        <div className="h-10 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/30">
          <div className="space-y-2">
            <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          </div>
        </div>
      </div>

      {/* History cards skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md ml-3" />
        <div className="h-32 rounded-[2rem] bg-zinc-100/50 dark:bg-zinc-900/40" />
      </div>
    </div>
  );
}
