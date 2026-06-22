import {
  SkeletonBlock,
  SkeletonStatCard,
} from "@/app/_components/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full space-y-6 pb-6">
      {/* Header */}
      <div className="space-y-3 pt-1 pb-3 animate-pulse">
        <SkeletonBlock className="h-10 w-72" />
        <div className="flex gap-4 pt-2">
          <SkeletonBlock className="h-10 w-48 rounded-2xl" />
          <SkeletonBlock className="h-10 w-28 rounded-2xl" />
        </div>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[0, 1, 2].map((i) => (
          <SkeletonBlock key={i} className="h-20 rounded-3xl" />
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid gap-2.5 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-3xl bg-white dark:bg-zinc-900 p-5 space-y-3 animate-pulse"
          >
            <SkeletonBlock className="h-4 w-36" />
            <SkeletonBlock className="h-3 w-52" />
            <SkeletonBlock className="h-[260px] w-full rounded-xl mt-4" />
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 space-y-4 animate-pulse">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-3 w-56" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <SkeletonBlock className="h-4 w-64" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
