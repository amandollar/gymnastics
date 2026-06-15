import {
  SkeletonBlock,
  SkeletonPageHeader,
  SkeletonTable,
} from "@/components/ui/Skeleton";

export default function EnquiriesLoading() {
  return (
    <div className="mx-auto max-w-6xl min-w-0 w-full space-y-4">
      {/* Header */}
      <SkeletonPageHeader hasButton={true} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 animate-pulse">
        <SkeletonBlock className="h-10 flex-1 rounded-lg" />
        <SkeletonBlock className="h-10 w-full sm:w-36 rounded-lg" />
      </div>

      {/* Table / List */}
      <SkeletonTable rows={8} cols={8} />
    </div>
  );
}
