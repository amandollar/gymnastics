import { SkeletonForm, SkeletonPageHeader } from "@/app/_components/Skeleton";

export default function EditStudentLoading() {
  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full space-y-6">
      <SkeletonPageHeader hasButton={false} />
      <div className="rounded-3xl bg-white dark:bg-zinc-950 p-6 shadow-sm">
        <SkeletonForm fields={8} />
      </div>
    </div>
  );
}
