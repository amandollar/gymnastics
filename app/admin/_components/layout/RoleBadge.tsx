const roleStyles: Record<string, string> = {
  ADMIN: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
  SUPER: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
  SUPER_ADMIN: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
  STAFF: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/80",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  SUPER: "Admin",
  SUPER_ADMIN: "Admin",
  STAFF: "Staff",
};

export default function RoleBadge({ role }: { role: string }) {
  const style = roleStyles[role] ?? roleStyles.STAFF;
  const label = roleLabels[role] ?? role;

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}
