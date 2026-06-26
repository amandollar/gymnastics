import { SkeletonBlock } from "@/app/_components/Skeleton";

export default function CoachProfileLoading() {
  return (
    <div className="space-y-6 min-w-0 pb-10">
      {/* Breadcrumb back link and Header action bar */}
      <div className="flex flex-col gap-2 animate-pulse">
        <SkeletonBlock className="h-4 w-28 rounded" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <SkeletonBlock className="h-9 w-48 rounded-lg" />
            <SkeletonBlock className="h-6 w-16 rounded-full" />
          </div>
          <SkeletonBlock className="h-9 w-28 rounded-xl shrink-0" />
        </div>
      </div>

      {/* Two-column Layout (Identical grid system spacing to Student Profile) */}
      <div className="grid gap-5 lg:grid-cols-[300px_1fr] min-w-0 animate-pulse">
        {/* ── Left Column: Avatar + Profile Info ── */}
        <div className="space-y-4 min-w-0">
          {/* Avatar and Coach name card */}
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <SkeletonBlock className="h-48 w-48 rounded-3xl shrink-0" />
            <div className="space-y-2 w-full flex flex-col items-center">
              <SkeletonBlock className="h-6 w-40 rounded" />
              <SkeletonBlock className="h-4 w-24 rounded" />
            </div>
          </div>

          {/* Details list card */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4 border border-zinc-100 dark:border-zinc-800/40">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <SkeletonBlock className="h-4 w-12 rounded" />
                  <SkeletonBlock className="h-4 w-28 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Column: Attendance & Schedule + Payout calculations ── */}
        <div className="space-y-4 min-w-0">
          {/* Attendance & Schedule card skeleton */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4 border border-zinc-100 dark:border-zinc-800/40">
            <div className="flex justify-between items-center">
              <SkeletonBlock className="h-4 w-36 rounded" />
              <SkeletonBlock className="h-4 w-16 rounded" />
            </div>
            
            {/* Calendar grids */}
            <div className="flex gap-6 overflow-x-hidden">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-[260px] shrink-0 space-y-3">
                  <SkeletonBlock className="h-6 w-full rounded" />
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <SkeletonBlock key={j} className="h-4 rounded" />
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 30 }).map((_, j) => (
                      <SkeletonBlock key={j} className="h-6 rounded-lg" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payout breakdown cards skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm p-4 space-y-4"
              >
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <SkeletonBlock className="h-5 w-24 rounded" />
                  <div className="flex gap-2">
                    <SkeletonBlock className="h-7 w-12 rounded-lg" />
                    <SkeletonBlock className="h-7 w-16 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <SkeletonBlock className="h-4 w-20 rounded" />
                    <SkeletonBlock className="h-4 w-16 rounded" />
                  </div>
                  <div className="flex justify-between">
                    <SkeletonBlock className="h-4 w-28 rounded" />
                    <SkeletonBlock className="h-4 w-12 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
