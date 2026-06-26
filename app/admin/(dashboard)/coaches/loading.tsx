import { SkeletonBlock, SkeletonPageHeader } from "@/app/_components/Skeleton";

export default function CoachesLoading() {
  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full space-y-6">
      {/* Header */}
      <SkeletonPageHeader hasButton={true} />

      {/* Filter Tabs */}
      <div className="flex gap-2 animate-pulse">
        <SkeletonBlock className="h-8 w-24 rounded-xl" />
        <SkeletonBlock className="h-8 w-20 rounded-xl" />
        <SkeletonBlock className="h-8 w-20 rounded-xl" />
      </div>

      {/* Grid of Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-4 animate-pulse shadow-sm"
          >
            {/* Header: Avatar + Identity */}
            <div className="flex items-start gap-3.5 pr-6">
              <SkeletonBlock className="h-20 w-20 shrink-0 rounded-2xl" />
              <div className="flex-1 space-y-2 mt-1">
                <SkeletonBlock className="h-5 w-3/4 rounded" />
                <SkeletonBlock className="h-4 w-1/2 rounded" />
                <SkeletonBlock className="h-4 w-1/3 rounded" />
              </div>
            </div>

            {/* Info rows */}
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-5/6 rounded" />
              <SkeletonBlock className="h-4 w-2/3 rounded" />
              <SkeletonBlock className="h-4 w-1/2 rounded" />
            </div>

            {/* Combined action card skeleton */}
            <div className="h-20 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
