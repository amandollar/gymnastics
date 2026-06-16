import {
  SkeletonBlock,
  SkeletonCalendar,
} from "@/components/ui/Skeleton";

export default function StudentDetailLoading() {
  return (
    <div className="space-y-6 min-w-0 animate-pulse">
      {/* Page title + action buttons skeleton */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-zinc-900 dark:text-zinc-55 truncate">
            Student Profile
          </h1>
          <SkeletonBlock className="h-6 w-20 rounded-full shrink-0" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop view actions skeleton */}
          <div className="hidden min-[1025px]:flex items-center gap-2">
            <SkeletonBlock className="h-10 w-32 rounded-xl" />
            <SkeletonBlock className="h-10 w-32 rounded-xl" />
            <SkeletonBlock className="h-10 w-36 rounded-xl" />
          </div>
          {/* Mobile view actions skeleton */}
          <div className="relative min-[1025px]:hidden">
            <SkeletonBlock className="h-9 w-9 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Two-column layout skeleton */}
      <div className="grid gap-5 lg:grid-cols-[300px_1fr] min-w-0">
        {/* ── Left column ── */}
        <div className="space-y-4 min-w-0">
          {/* Avatar + name card skeleton */}
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <SkeletonBlock className="h-32 w-32 rounded-full shrink-0" />
            <div className="space-y-2 flex flex-col items-center w-full">
              <SkeletonBlock className="h-6 w-36" />
              <SkeletonBlock className="h-4 w-20" />
            </div>
          </div>

          {/* Basic info card skeleton */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
            <div className="space-y-3">
              {/* Age, Gender, DOB */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between gap-2">
                  <SkeletonBlock className="h-4 w-12" />
                  <SkeletonBlock className="h-4 w-24" />
                </div>
              ))}
              <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
              {/* Parent, Phone */}
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex justify-between gap-2">
                  <SkeletonBlock className="h-4 w-16" />
                  <SkeletonBlock className="h-4 w-28" />
                </div>
              ))}
              <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
              {/* Joined, Tenure */}
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex justify-between gap-2">
                  <SkeletonBlock className="h-4 w-14" />
                  <SkeletonBlock className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>

          {/* Medical & Notes Card skeleton */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
            <div className="space-y-1.5">
              <SkeletonBlock className="h-3.5 w-28" />
              <SkeletonBlock className="h-4 w-full" />
            </div>
            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
            <div className="space-y-1.5">
              <SkeletonBlock className="h-3.5 w-16" />
              <SkeletonBlock className="h-4 w-full" />
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4 min-w-0">
          {/* Attendance Card skeleton */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-5 w-44 shrink-0" />
              <SkeletonBlock className="h-4.5 w-28 shrink-0" />
            </div>

            {/* Calendars */}
            <div className="flex gap-6 overflow-x-hidden pb-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="w-[260px] shrink-0 space-y-3">
                  <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2 flex justify-center">
                    <SkeletonBlock className="h-4 w-28" />
                  </div>
                  <SkeletonCalendar />
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex gap-4">
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="h-4 w-24" />
            </div>
          </div>

          {/* Active Plan Card skeleton */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-4 w-16" />
            </div>

            <SkeletonBlock className="h-6 w-32 rounded-full" />

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <SkeletonBlock className="h-3.5 w-24" />
                <SkeletonBlock className="h-3.5 w-20" />
              </div>
              <SkeletonBlock className="h-2 w-full rounded-full" />
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 p-3 space-y-1.5">
                <SkeletonBlock className="h-3 w-10" />
                <SkeletonBlock className="h-5 w-16" />
              </div>
              <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 p-3 space-y-1.5">
                <SkeletonBlock className="h-3 w-16" />
                <SkeletonBlock className="h-5 w-24" />
              </div>
            </div>

            <SkeletonBlock className="h-10 w-full rounded-xl" />
          </div>

          {/* Plan History skeleton */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
            <SkeletonBlock className="h-5 w-28" />
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <div className="space-y-1">
                    <SkeletonBlock className="h-4 w-24" />
                    <SkeletonBlock className="h-3 w-32" />
                  </div>
                  <SkeletonBlock className="h-6 w-20 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
