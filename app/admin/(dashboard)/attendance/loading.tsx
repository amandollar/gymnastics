import {
  SkeletonBlock,
  SkeletonCalendar,
  SkeletonStatCard,
} from "@/app/_components/Skeleton";

export default function AttendanceLoading() {
  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 animate-pulse">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-36" />
          <SkeletonBlock className="h-3.5 w-60" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-9 w-28 rounded-xl" />
          <SkeletonBlock className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Calendar + sidebar layout */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Calendar */}
        <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-5 w-32" />
            <div className="flex gap-2">
              <SkeletonBlock className="h-8 w-8 rounded-lg" />
              <SkeletonBlock className="h-8 w-8 rounded-lg" />
            </div>
          </div>
          <SkeletonCalendar />
        </div>

        {/* Right panel */}
        <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 space-y-4 animate-pulse">
          <SkeletonBlock className="h-5 w-28" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonBlock className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <SkeletonBlock className="h-3.5 w-full" />
                <SkeletonBlock className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
