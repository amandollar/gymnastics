const roleStyles: Record<string, string> = {
  ADMIN: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
  MANAGER: "bg-blue-50 text-blue-800 ring-1 ring-blue-200/80",
  TRAINER: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/80",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  TRAINER: "Trainer",
};

export default function RoleBadge({ role }: { role: string }) {
  const style = roleStyles[role] ?? roleStyles.TRAINER;
  const label = roleLabels[role] ?? role;

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}
