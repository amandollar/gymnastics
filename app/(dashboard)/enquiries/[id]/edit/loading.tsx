import { SkeletonForm, SkeletonPageHeader } from "@/components/ui/Skeleton";

export default function EditEnquiryLoading() {
  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full space-y-6">
      <SkeletonPageHeader hasButton={false} />
      <div className="rounded-3xl bg-white dark:bg-zinc-950 p-6 shadow-sm">
        <SkeletonForm fields={6} />
      </div>
    </div>
  );
}
