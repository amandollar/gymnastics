/**
 * Skeleton UI primitives for page loading states.
 *
 * Usage:
 *   <SkeletonBlock className="h-8 w-48 rounded-lg" />
 *   <SkeletonTable rows={6} cols={5} />
 */

/** Single animated shimmer block */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded-lg ${className}`}
    />
  );
}

/** A row of shimmer blocks (for header / stat cards) */
export function SkeletonRow({
  cols = 3,
  className = "",
}: {
  cols?: number;
  className?: string;
}) {
  return (
    <div className={`flex gap-3 ${className}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonBlock key={i} className="flex-1 h-10" />
      ))}
    </div>
  );
}

/** Full table skeleton (thead + tbody rows) */
export function SkeletonTable({
  rows = 8,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="w-full space-y-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="flex gap-4 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock
            key={i}
            className={`h-3.5 rounded ${i === 0 ? "w-8" : "flex-1"}`}
          />
        ))}
      </div>
      {/* Body rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-4 items-center px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
        >
          {/* Avatar */}
          <SkeletonBlock className="h-8 w-8 rounded-full shrink-0" />
          {/* Remaining cols */}
          {Array.from({ length: cols - 1 }).map((_, c) => (
            <SkeletonBlock
              key={c}
              className={`h-3.5 rounded ${c === 0 ? "w-28" : "flex-1"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Stat card skeleton */
export function SkeletonStatCard() {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3 animate-pulse">
      <SkeletonBlock className="h-3.5 w-20" />
      <SkeletonBlock className="h-8 w-32" />
      <SkeletonBlock className="h-3 w-16" />
    </div>
  );
}

/** Page header skeleton (title + subtitle + optional button) */
export function SkeletonPageHeader({ hasButton = true }: { hasButton?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 animate-pulse">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-48" />
        <SkeletonBlock className="h-3.5 w-72" />
      </div>
      {hasButton && <SkeletonBlock className="h-9 w-32 rounded-xl" />}
    </div>
  );
}

/** Form skeleton (stacked labelled inputs) */
export function SkeletonForm({ fields = 6 }: { fields?: number }) {
  return (
    <div className="space-y-5 animate-pulse">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-10 w-full rounded-xl" />
        </div>
      ))}
      <SkeletonBlock className="h-10 w-36 rounded-xl mt-2" />
    </div>
  );
}

/** Calendar grid skeleton */
export function SkeletonCalendar() {
  return (
    <div className="animate-pulse space-y-3">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <SkeletonBlock key={i} className="h-5 rounded" />
        ))}
      </div>
      {/* 5 weeks of cells */}
      {Array.from({ length: 5 }).map((_, w) => (
        <div key={w} className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, d) => (
            <SkeletonBlock key={d} className="h-10 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}
