import type { EnquiryStatus } from "@prisma/client";

export const ENQUIRY_STATUS_STYLES: Record<
  EnquiryStatus,
  { label: string; className: string }
> = {
  NEW: {
    label: "New",
    className: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/50 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800/30",
  },
  CONTACTED: {
    label: "Contacted",
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800/30",
  },
  FOLLOW_UP: {
    label: "Follow-up",
    className: "bg-purple-50 text-purple-700 ring-1 ring-purple-200/50 dark:bg-purple-900/30 dark:text-purple-400 dark:ring-purple-800/30",
  },
  CONVERTED: {
    label: "Converted",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800/30",
  },
  LOST: {
    label: "Lost",
    className: "bg-zinc-100 text-zinc-650 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
  },
};

export default function EnquiryStatusBadge({
  status,
}: {
  status: EnquiryStatus;
}) {
  const style = ENQUIRY_STATUS_STYLES[status] || {
    label: status,
    className: "bg-zinc-100 text-zinc-650 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${style.className}`}
    >
      {style.label}
    </span>
  );
}
