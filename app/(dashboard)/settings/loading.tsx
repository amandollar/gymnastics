import {
  SkeletonBlock,
  SkeletonPageHeader,
  SkeletonTable,
} from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 relative min-w-0 w-full animate-pulse">
      {/* Page Header */}
      <SkeletonPageHeader hasButton={true} />

      {/* Main Grid */}
      <div className="grid gap-3.5 lg:grid-cols-3 items-start min-w-0">
        
        {/* Left Column: User list & search */}
        <div className="lg:col-span-2 space-y-4 min-w-0">
          <div className="rounded-lg border-0 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <SkeletonBlock className="h-5 w-24" />
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <SkeletonBlock className="h-9 w-full sm:w-48 rounded-lg" />
                <SkeletonBlock className="h-9 w-full sm:w-32 rounded-lg" />
              </div>
            </div>
            
            {/* Table skeleton */}
            <SkeletonTable rows={6} cols={4} />
          </div>
        </div>

        {/* Right Column: Role Preview & Session */}
        <div className="space-y-3.5">
          {/* Role Preview Card */}
          <div className="rounded-lg border-0 bg-white dark:bg-zinc-950 p-6 shadow-sm space-y-4">
            <div className="flex flex-col items-center text-center space-y-3">
              <SkeletonBlock className="h-16 w-16 rounded-full" />
              <SkeletonBlock className="h-5 w-36" />
              <SkeletonBlock className="h-4 w-48" />
              <SkeletonBlock className="h-6 w-20 rounded-full" />
            </div>
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-3">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-5/6" />
            </div>
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-2">
              <SkeletonBlock className="h-3 w-12 mb-2" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <SkeletonBlock className="h-4 w-20" />
                  <SkeletonBlock className="h-4 w-8" />
                </div>
              ))}
            </div>
          </div>

          {/* Session Settings Card */}
          <div className="rounded-lg border-0 bg-white dark:bg-zinc-950 p-6 shadow-sm space-y-3">
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-3.5 w-full" />
            <SkeletonBlock className="h-10 w-full rounded-lg mt-2" />
          </div>
        </div>

      </div>
    </div>
  );
}
