"use client";

import Link from "next/link";
import { Home, Users, FileText, CheckCircle, Settings, Dumbbell, ClipboardList } from "lucide-react";

export const navLinkClass = (active: boolean, isCollapsed = false) =>
  `flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"} rounded-lg ${isCollapsed ? "px-2" : "px-3"} ${
    isCollapsed ? "py-3.5" : "py-2.5"
  } text-sm font-medium transition-all ${
    active
      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-50"
  }`;

export default function DashboardNav({
  pathname,
  isAdmin,
  onNavigate,
  isCollapsed = false,
}: {
  pathname: string;
  isAdmin: boolean;
  onNavigate?: () => void;
  isCollapsed?: boolean;
}) {
  const close = onNavigate ?? (() => {});
  const iconClass = `shrink-0 transition-all ${isCollapsed ? "h-5 w-5" : "h-4 w-4"}`;

  return (
    <nav className={`transition-all ${isCollapsed ? "space-y-2 p-1.5" : "space-y-0.5 p-3"}`}>
      <Link
        href="/dashboard"
        onClick={close}
        className={navLinkClass(pathname === "/dashboard", isCollapsed)}
        title={isCollapsed ? "Dashboard" : undefined}
      >
        <HomeIcon className={iconClass} />
        {!isCollapsed && "Dashboard"}
      </Link>
      <Link
        href="/enquiries"
        onClick={close}
        className={navLinkClass(pathname.startsWith("/enquiries"), isCollapsed)}
        title={isCollapsed ? "Enquiries" : undefined}
      >
        <EnquiryIcon className={iconClass} />
        {!isCollapsed && "Enquiries"}
      </Link>
      <Link
        href="/students"
        onClick={close}
        className={navLinkClass(pathname.startsWith("/students"), isCollapsed)}
        title={isCollapsed ? "Students" : undefined}
      >
        <UsersIcon className={iconClass} />
        {!isCollapsed && "Students"}
      </Link>
      <Link
        href="/coaches"
        onClick={close}
        className={navLinkClass(pathname.startsWith("/coaches"), isCollapsed)}
        title={isCollapsed ? "Coaches" : undefined}
      >
        <GymIcon className={iconClass} />
        {!isCollapsed && "Coaches"}
      </Link>
      <Link
        href="/attendance"
        onClick={close}
        className={navLinkClass(pathname.startsWith("/attendance"), isCollapsed)}
        title={isCollapsed ? "Attendance" : undefined}
      >
        <CheckIcon className={iconClass} />
        {!isCollapsed && "Attendance"}
      </Link>
      <Link
        href="/plans"
        onClick={close}
        className={navLinkClass(pathname === "/plans", isCollapsed)}
        title={isCollapsed ? "Plans" : undefined}
      >
        <DocIcon className={iconClass} />
        {!isCollapsed && "Plans"}
      </Link>
      {isAdmin && (
        <Link
          href="/settings"
          onClick={close}
          className={navLinkClass(pathname === "/settings", isCollapsed)}
          title={isCollapsed ? "Settings" : undefined}
        >
          <SettingsIcon className={iconClass} />
          {!isCollapsed && "Settings"}
        </Link>
      )}
    </nav>
  );
}

function HomeIcon({ className = "h-4 w-4 shrink-0" }: { className?: string } = {}) {
  return <Home className={className} strokeWidth={2} />;
}

export function UsersIcon({ className = "h-4 w-4 shrink-0" }: { className?: string } = {}) {
  return <Users className={className} strokeWidth={2} />;
}

export function GymIcon({ className = "h-4 w-4 shrink-0" }: { className?: string } = {}) {
  return <Dumbbell className={className} strokeWidth={2} />;
}

export function DocIcon({ className = "h-4 w-4 shrink-0" }: { className?: string } = {}) {
  return <FileText className={className} strokeWidth={2} />;
}

export function CheckIcon({ className = "h-4 w-4 shrink-0 opacity-60" }: { className?: string } = {}) {
  return <CheckCircle className={className} strokeWidth={2} />;
}

function SettingsIcon({ className = "h-4 w-4 shrink-0" }: { className?: string } = {}) {
  return <Settings className={className} strokeWidth={2} />;
}

export function EnquiryIcon({ className = "h-4 w-4 shrink-0" }: { className?: string } = {}) {
  return <ClipboardList className={className} strokeWidth={2} />;
}

export { HomeIcon, SettingsIcon };
