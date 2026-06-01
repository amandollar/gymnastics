import {
  STATUS_STYLES,
  type StudentStatus,
} from "@/lib/utils/student";

export default function StudentStatusBadge({
  status,
}: {
  status: StudentStatus;
}) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${style.className}`}
    >
      {style.label}
    </span>
  );
}
