"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  SettingsIcon,
  UsersIcon,
  EnquiryIcon,
  GymIcon,
  DocIcon,
  CheckIcon,
  FinanceIcon,
} from "./DashboardNav";

export function MobileBottomNav({
  isAdmin,
  userRole = "STAFF",
  signOutAction: _signOutAction,
}: {
  isAdmin: boolean;
  userRole?: string;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();

  const activePathname = pathname.startsWith("/admin")
    ? pathname
    : `/admin${pathname === "/" ? "/dashboard" : pathname}`;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className="flex h-14 items-center overflow-x-auto scrollbar-none px-2 gap-1">
        <Link
          href="/admin/dashboard"
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium flex-1 min-w-[68px] shrink-0 ${
            activePathname === "/admin/dashboard"
              ? "text-brand-orange-500"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <HomeIcon className="h-4.5 w-4.5 shrink-0" />
          Dashboard
        </Link>
        <Link
          href="/admin/enquiries"
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium flex-1 min-w-[68px] shrink-0 ${
            activePathname.startsWith("/admin/enquiries")
              ? "text-brand-orange-500"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <EnquiryIcon className="h-4.5 w-4.5 shrink-0" />
          Enquiries
        </Link>
        <Link
          href="/admin/students"
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium flex-1 min-w-[68px] shrink-0 ${
            activePathname.startsWith("/admin/students")
              ? "text-brand-orange-500"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <UsersIcon className="h-4.5 w-4.5 shrink-0" />
          Students
        </Link>
        <Link
          href="/admin/coaches"
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium flex-1 min-w-[68px] shrink-0 ${
            activePathname.startsWith("/admin/coaches")
              ? "text-brand-orange-500"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <GymIcon className="h-4.5 w-4.5 shrink-0" />
          Coach & Staff
        </Link>
        <Link
          href="/admin/attendance"
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium flex-1 min-w-[68px] shrink-0 ${
            activePathname.startsWith("/admin/attendance")
              ? "text-brand-orange-500"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <CheckIcon className="h-4.5 w-4.5 shrink-0" />
          Attendance
        </Link>
        <Link
          href="/admin/plans"
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium flex-1 min-w-[68px] shrink-0 ${
            activePathname === "/admin/plans"
              ? "text-brand-orange-500"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <DocIcon className="h-4.5 w-4.5 shrink-0" />
          Plans
        </Link>
        {isAdmin && (
          <Link
            href="/admin/finance"
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium flex-1 min-w-[68px] shrink-0 ${
              activePathname.startsWith("/admin/finance")
                ? "text-brand-orange-500"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <FinanceIcon className="h-4.5 w-4.5 shrink-0" />
            Finance
          </Link>
        )}
        {(isAdmin || userRole === "STAFF") && (
          <Link
            href="/admin/settings"
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium flex-1 min-w-[68px] shrink-0 ${
              activePathname === "/admin/settings"
                ? "text-brand-orange-500"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <SettingsIcon className="h-4.5 w-4.5 shrink-0" />
            Settings
          </Link>
        )}
      </div>
    </nav>
  );
}
