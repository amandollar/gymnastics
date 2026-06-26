import {
  SkeletonBlock,
  SkeletonPageHeader,
  SkeletonTable,
} from "@/app/_components/Skeleton";

export default function StudentsLoading() {
  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full space-y-5">
      {/* Page header */}
      <SkeletonPageHeader hasButton />

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 animate-pulse">
        <SkeletonBlock className="h-10 flex-1 rounded-xl" />
        <SkeletonBlock className="h-10 w-36 rounded-xl" />
        <SkeletonBlock className="h-10 w-32 rounded-xl" />
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 animate-pulse">
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Table */}
      <SkeletonTable rows={10} cols={6} />
    </div>
  );
}
