"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Home, Users, FileText, CheckCircle, IndianRupee, Settings, Dumbbell, ClipboardList } from "lucide-react";

export const navLinkClass = (active: boolean, isCollapsed = false) =>
  `flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"} rounded-lg ${isCollapsed ? "px-2" : "px-3"} ${
    isCollapsed ? "py-3.5" : "py-2.5"
  } text-sm font-medium transition-all ${
    active
      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-50"
  }`;

const disabledClass = (isCollapsed = false) =>
  `flex items-center ${isCollapsed ? "justify-center" : "justify-between"} rounded-lg ${isCollapsed ? "px-2 py-3.5" : "px-3 py-2.5"} text-sm font-medium text-zinc-400 dark:text-zinc-600 cursor-not-allowed`;

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
  const disabledIconClass = `shrink-0 opacity-60 transition-all ${isCollapsed ? "h-5 w-5" : "h-4 w-4"}`;

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
        href="/students"
        onClick={close}
        className={navLinkClass(pathname.startsWith("/students"), isCollapsed)}
        title={isCollapsed ? "Students" : undefined}
      >
        <UsersIcon className={iconClass} />
        {!isCollapsed && "Students"}
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
      <Link
        href="/mentors"
        onClick={close}
        className={navLinkClass(pathname.startsWith("/mentors"), isCollapsed)}
        title={isCollapsed ? "Mentors" : undefined}
      >
        <GymIcon className={iconClass} />
        {!isCollapsed && "Mentors"}
      </Link>
      <DisabledItem icon={<CheckIcon className={disabledIconClass} />} label="Attendance" isCollapsed={isCollapsed} />
      <DisabledItem icon={<CurrencyIcon className={disabledIconClass} />} label="Fees" isCollapsed={isCollapsed} />
      <Link
        href="/enquiries"
        onClick={close}
        className={navLinkClass(pathname.startsWith("/enquiries"), isCollapsed)}
        title={isCollapsed ? "Enquiries" : undefined}
      >
        <EnquiryIcon className={iconClass} />
        {!isCollapsed && "Enquiries"}
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

function DisabledItem({
  icon,
  label,
  isCollapsed = false,
}: {
  icon: ReactNode;
  label: string;
  isCollapsed?: boolean;
}) {
  return (
    <div
      className={disabledClass(isCollapsed)}
      title={isCollapsed ? `${label} (Soon)` : undefined}
    >
      <span className="flex items-center gap-2.5">
        {icon}
        {!isCollapsed && label}
      </span>
      {!isCollapsed && (
        <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
          Soon
        </span>
      )}
    </div>
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

function DocIcon({ className = "h-4 w-4 shrink-0" }: { className?: string } = {}) {
  return <FileText className={className} strokeWidth={2} />;
}

function CheckIcon({ className = "h-4 w-4 shrink-0 opacity-60" }: { className?: string } = {}) {
  return <CheckCircle className={className} strokeWidth={2} />;
}

function CurrencyIcon({ className = "h-4 w-4 shrink-0 opacity-60" }: { className?: string } = {}) {
  return <IndianRupee className={className} strokeWidth={2} />;
}

function SettingsIcon({ className = "h-4 w-4 shrink-0" }: { className?: string } = {}) {
  return <Settings className={className} strokeWidth={2} />;
}

export function EnquiryIcon({ className = "h-4 w-4 shrink-0" }: { className?: string } = {}) {
  return <ClipboardList className={className} strokeWidth={2} />;
}

export { HomeIcon, SettingsIcon };
