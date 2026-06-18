import { SkeletonBlock } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-6xl relative min-w-0 w-full px-2 sm:px-0 animate-pulse">
      <div className="flex flex-col md:flex-row gap-6 items-stretch">
        
        {/* Desktop Sidebar Settings Navigation Skeleton (visible on md and up) */}
        <aside className="hidden md:flex flex-col md:w-44 lg:w-64 shrink-0 rounded-[28px] bg-white dark:bg-zinc-950 p-6 md:p-4 lg:p-6 shadow-xs gap-5 min-h-[580px]">
          <div>
            <SkeletonBlock className="h-6 w-24 rounded-lg" />
          </div>
          <div className="flex flex-col gap-3 mt-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="w-full flex items-center gap-2.5 px-3 py-2.5">
                <SkeletonBlock className="h-4 w-4 rounded-md hidden lg:block shrink-0" />
                <SkeletonBlock className="h-4 w-24 rounded-md" />
              </div>
            ))}
          </div>
          
          <div className="flex-1" />
          
          {/* Logout button skeleton */}
          <div className="w-full">
            <SkeletonBlock className="h-10 w-full rounded-lg" />
          </div>
        </aside>

        {/* Mobile Settings Menu Skeleton (visible below md) */}
        <div className="flex md:hidden flex-col w-full shrink-0 gap-6 min-h-[calc(100vh-140px)] py-4">
          <div className="flex items-center justify-between gap-3 w-full">
            <SkeletonBlock className="h-8 w-32 rounded-lg" />
            <SkeletonBlock className="h-6 w-16 rounded-full" />
          </div>

          {/* Options List Card Skeleton */}
          <div className="bg-white dark:bg-zinc-955 rounded-2xl border border-zinc-150 dark:border-zinc-850/80 shadow-xs p-6 divide-y divide-zinc-100 dark:divide-zinc-800/80 space-y-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="w-full flex items-center justify-between pt-4 first:pt-0">
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="h-5 w-5 rounded-md" />
                  <SkeletonBlock className="h-4 w-28 rounded-md" />
                </div>
                <SkeletonBlock className="h-4 w-4 rounded-md" />
              </div>
            ))}
          </div>

          <div className="flex-1" />

          {/* Logout button skeleton */}
          <div className="mt-8">
            <SkeletonBlock className="h-12 w-full rounded-xl" />
          </div>
        </div>

        {/* Right Section: Content Area Skeleton (visible on desktop by default) */}
        <main className="hidden md:block flex-1 w-full min-w-0 md:bg-white md:dark:bg-zinc-955 md:rounded-[28px] p-0 md:p-8 md:shadow-xs md:border-0 min-h-[580px]">
          <div className="w-full space-y-6">
            {/* Header / Title block */}
            <div className="space-y-2">
              <SkeletonBlock className="h-5 w-32 rounded-md" />
            </div>

            {/* Academy profile view skeleton */}
            <div className="space-y-8">
              {/* Centered logo skeleton */}
              <div className="flex flex-col items-center py-4">
                <SkeletonBlock className="h-32 w-32 rounded-full" />
                <SkeletonBlock className="h-5 w-48 rounded-md mt-4" />
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <SkeletonBlock className="h-4 w-24 rounded-md" />
                    <SkeletonBlock className="h-10 w-full rounded-xl" />
                  </div>
                ))}
              </div>

              {/* Textarea field */}
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-24 rounded-md" />
                <SkeletonBlock className="h-24 w-full rounded-xl" />
              </div>

              {/* Action button */}
              <div className="flex justify-end pt-4">
                <SkeletonBlock className="h-10 w-32 rounded-xl" />
              </div>
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}
