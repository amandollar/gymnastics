import { SkeletonBlock } from "@/app/_components/Skeleton";

export default function PlansLoading() {
  return (
    <div className="space-y-5 min-w-0 w-full animate-pulse">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <SkeletonBlock className="h-9 w-40" />
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <SkeletonBlock className="h-10 w-28 rounded-lg" />
          <SkeletonBlock className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      <div className="max-w-2xl min-[1124px]:max-w-5xl mx-auto">
        <div className="grid gap-6 min-[1124px]:grid-cols-12 items-start w-full">
          {/* Left Column: Form Fields */}
          <div className="min-[1124px]:col-span-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 space-y-6">
              {/* Student selection */}
              <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6 space-y-3">
                <SkeletonBlock className="h-3 w-16" />
                <SkeletonBlock className="h-10 w-full rounded-xl" />
              </div>

              {/* Divider */}
              <div className="border-t border-zinc-100 dark:border-zinc-800" />

              {/* Batch selection */}
              <div className="px-5 py-4 sm:px-6 space-y-3">
                <SkeletonBlock className="h-3 w-12" />
                <SkeletonBlock className="h-10 w-full rounded-xl" />
              </div>

              {/* Divider */}
              <div className="border-t border-zinc-100 dark:border-zinc-800" />

              {/* Plan builder */}
              <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-4 space-y-6">
                {/* Plan type */}
                <div className="space-y-3">
                  <SkeletonBlock className="h-3.5 w-20" />
                  <SkeletonBlock className="h-10 w-64 rounded-2xl" />
                </div>

                {/* Date range grid */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-3">
                    <SkeletonBlock className="h-3.5 w-20" />
                    <SkeletonBlock className="h-10 w-full rounded-xl" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <SkeletonBlock className="h-3.5 w-16" />
                      <div className="flex gap-1.5">
                        <SkeletonBlock className="h-6 w-12 rounded-xl" />
                        <SkeletonBlock className="h-6 w-12 rounded-xl" />
                      </div>
                    </div>
                    <SkeletonBlock className="h-10 w-full rounded-xl" />
                  </div>
                </div>

                {/* Class days */}
                <div className="space-y-3">
                  <SkeletonBlock className="h-3.5 w-24" />
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <SkeletonBlock key={i} className="h-11 w-14 rounded-xl" />
                    ))}
                  </div>
                </div>

                {/* Discount */}
                <div className="space-y-3">
                  <SkeletonBlock className="h-3.5 w-20" />
                  <SkeletonBlock className="h-10 w-24 rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Fee Preview & Save Action */}
          <div className="min-[1124px]:col-span-4 min-[1124px]:sticky min-[1124px]:top-24 space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 shadow-xs overflow-hidden">
              <div className="p-5 sm:p-6 space-y-4">
                <SkeletonBlock className="h-3.5 w-24" />
                {/* Fee preview dashed box */}
                <div className="h-28 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-4">
                  <SkeletonBlock className="h-4 w-72" />
                </div>
              </div>

              {/* Submit footer */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 sm:px-6 py-4 flex items-center justify-between bg-zinc-50/60 dark:bg-zinc-800/30">
                <div />
                <SkeletonBlock className="h-10 w-32 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info text below */}
      <SkeletonBlock className="h-4 w-96 px-1" />
    </div>
  );
}
