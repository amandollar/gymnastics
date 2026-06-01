"use client";

import { usePathname } from "next/navigation";
import DashboardNav from "./DashboardNav";

export default function DashboardSidebar({
  isAdmin,
}: {
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 flex-col fixed inset-y-0 left-0 z-20 border-r border-zinc-200 bg-white">
      <div className="flex h-14 items-center gap-2.5 border-b border-zinc-200 px-4">
        <img
          src="/logo.webp"
          alt="TAG"
          className="h-8 w-8 rounded-full border border-zinc-200 object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900">TAG CRM</p>
          <p className="truncate text-xs text-zinc-500">Academy of Gymnastics</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <DashboardNav pathname={pathname} isAdmin={isAdmin} />
      </div>
    </aside>
  );
}
