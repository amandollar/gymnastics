import {
  SkeletonBlock,
  SkeletonCalendar,
} from "@/components/ui/Skeleton";

export default function StudentDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full space-y-6 animate-pulse">
      {/* Student Profile Card Header */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-5">
        {/* Avatar */}
        <SkeletonBlock className="h-24 w-24 rounded-full shrink-0" />
        
        {/* Info */}
        <div className="flex-1 space-y-3 min-w-0 w-full text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
            <SkeletonBlock className="h-8 w-48 mx-auto md:mx-0" />
            <SkeletonBlock className="h-6 w-20 rounded-full mx-auto md:mx-0" />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl pt-2">
            <div>
              <SkeletonBlock className="h-3 w-16 mb-1.5" />
              <SkeletonBlock className="h-4.5 w-28" />
            </div>
            <div>
              <SkeletonBlock className="h-3 w-16 mb-1.5" />
              <SkeletonBlock className="h-4.5 w-20" />
            </div>
            <div>
              <SkeletonBlock className="h-3 w-20 mb-1.5" />
              <SkeletonBlock className="h-4.5 w-32" />
            </div>
            <div>
              <SkeletonBlock className="h-3 w-24 mb-1.5" />
              <SkeletonBlock className="h-4.5 w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content grid: Plan Package on the left/right and Attendance & Schedule */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left/Middle cols: Attendance & Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-5 w-44" />
              <SkeletonBlock className="h-4.5 w-28" />
            </div>
            
            {/* Multi-month scrollable calendars */}
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
        </div>

        {/* Right col: Plan Package */}
        <div className="space-y-4">
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
        </div>
      </div>
    </div>
  );
}
