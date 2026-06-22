import { SkeletonBlock, SkeletonPageHeader } from "@/app/_components/Skeleton";

export default function BulkUploadLoading() {
  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full space-y-6 animate-pulse">
      <SkeletonPageHeader hasButton={false} />
      
      <div className="rounded-3xl bg-white dark:bg-zinc-950 p-8 shadow-sm space-y-6 flex flex-col items-center justify-center min-h-[300px] border border-dashed border-zinc-200 dark:border-zinc-800">
        <SkeletonBlock className="h-12 w-12 rounded-full" />
        <div className="space-y-2 text-center flex flex-col items-center">
          <SkeletonBlock className="h-5 w-48" />
          <SkeletonBlock className="h-3.5 w-64" />
        </div>
        <SkeletonBlock className="h-10 w-36 rounded-xl" />
      </div>

      <div className="rounded-3xl bg-white dark:bg-zinc-950 p-6 shadow-sm space-y-4">
        <SkeletonBlock className="h-5 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 items-center">
            <SkeletonBlock className="h-4.5 w-4 rounded" />
            <SkeletonBlock className="h-4.5 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
