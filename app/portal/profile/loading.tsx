export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl flex flex-col gap-8 animate-pulse">
        
        {/* Navigation & Header Placeholder */}
        <div className="flex items-center justify-between pb-2">
          <div className="h-8 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
          <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        </div>

        {/* Profile Card Header Placeholder */}
        <div className="relative overflow-hidden w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-[2.5rem] p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar Skeleton */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 bg-zinc-200 dark:bg-zinc-800 rounded-full shrink-0" />

          {/* Student Info Skeleton */}
          <div className="flex-1 w-full flex flex-col items-center sm:items-start gap-3">
            <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
            <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          </div>
        </div>

        {/* Profile Details List Placeholder */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-[2.5rem] p-8 sm:p-10 shadow-xl space-y-8">
          <div className="h-6 w-44 bg-zinc-200 dark:bg-zinc-800 rounded-md mb-2" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8 sm:gap-y-10">
            {/* Generate 7 skeletons for list items */}
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-9 h-9 bg-zinc-200 dark:bg-zinc-800 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 mt-1">
                  <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                  <div className="h-4.5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
