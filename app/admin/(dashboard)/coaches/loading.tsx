import { SkeletonBlock } from "@/components/ui/Skeleton";

export default function CoachesLoading() {
  return (
    <div className="mx-auto max-w-6xl min-w-0 w-full flex flex-col items-center justify-center min-h-[60vh] text-center p-4 animate-pulse">
      <div className="relative mb-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-md">
          <SkeletonBlock className="h-10 w-10 rounded-lg" />
        </div>
      </div>
      <SkeletonBlock className="h-7 w-32 mb-2" />
      <SkeletonBlock className="h-6 w-16 rounded-full" />
    </div>
  );
}
