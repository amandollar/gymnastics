"use client";

import Link from "next/link";
import {
  Home,
  Users,
  CheckCircle,
  Settings,
  Dumbbell,
  ClipboardList,
  IndianRupee,
  Calendar,
} from "lucide-react";

export const navLinkClass = (active: boolean, isCollapsed = false) =>
  `flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"} rounded-lg ${isCollapsed ? "px-2" : "px-3"} ${
    isCollapsed ? "py-3.5" : "py-2.5"
  } text-sm font-medium transition-all ${
    active
      ? "bg-brand-orange-500/15 dark:bg-brand-orange-500/25 text-brand-orange-600 dark:text-brand-orange-400 font-semibold"
      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-50"
  }`;

export default function DashboardNav({
  pathname,
  isAdmin,
  userRole = "STAFF",
  onNavigate,
  isCollapsed = false,
}: {
  pathname: string;
  isAdmin: boolean;
  userRole?: string;
  onNavigate?: () => void;
  isCollapsed?: boolean;
}) {
  const close = onNavigate ?? (() => {});
  const iconClass = `shrink-0 transition-all ${isCollapsed ? "h-5 w-5" : "h-4 w-4"}`;

  const activePathname = pathname.startsWith("/admin")
    ? pathname
    : `/admin${pathname === "/" ? "/dashboard" : pathname}`;

  return (
    <nav
      className={`transition-all ${isCollapsed ? "space-y-2 p-1.5" : "space-y-0.5 p-3"}`}
    >
      <Link
        href="/admin/dashboard"
        onClick={close}
        className={`${navLinkClass(activePathname === "/admin/dashboard", isCollapsed)} relative group`}
      >
        <HomeIcon className={iconClass} />
        {!isCollapsed && "Dashboard"}
        {isCollapsed && (
          <span className="pointer-events-none absolute left-full ml-4 z-50 rounded-xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-100 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-md translate-x-1 group-hover:translate-x-0">
            Dashboard
          </span>
        )}
      </Link>
      <Link
        href="/admin/enquiries"
        onClick={close}
        className={`${navLinkClass(activePathname.startsWith("/admin/enquiries"), isCollapsed)} relative group`}
      >
        <EnquiryIcon className={iconClass} />
        {!isCollapsed && "Enquiries"}
        {isCollapsed && (
          <span className="pointer-events-none absolute left-full ml-4 z-50 rounded-xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-100 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-md translate-x-1 group-hover:translate-x-0">
            Enquiries
          </span>
        )}
      </Link>
      <Link
        href="/admin/students"
        onClick={close}
        className={`${navLinkClass(activePathname.startsWith("/admin/students"), isCollapsed)} relative group`}
      >
        <UsersIcon className={iconClass} />
        {!isCollapsed && "Students"}
        {isCollapsed && (
          <span className="pointer-events-none absolute left-full ml-4 z-50 rounded-xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-100 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-md translate-x-1 group-hover:translate-x-0">
            Students
          </span>
        )}
      </Link>
      <Link
        href="/admin/coaches"
        onClick={close}
        className={`${navLinkClass(activePathname.startsWith("/admin/coaches"), isCollapsed)} relative group`}
      >
        <GymIcon className={iconClass} />
        {!isCollapsed && "Coach & Staff"}
        {isCollapsed && (
          <span className="pointer-events-none absolute left-full ml-4 z-50 rounded-xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-100 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-md translate-x-1 group-hover:translate-x-0">
            Coach & Staff
          </span>
        )}
      </Link>
      <Link
        href="/admin/attendance"
        onClick={close}
        className={`${navLinkClass(activePathname.startsWith("/admin/attendance"), isCollapsed)} relative group`}
      >
        <CheckIcon className={iconClass} />
        {!isCollapsed && "Attendance"}
        {isCollapsed && (
          <span className="pointer-events-none absolute left-full ml-4 z-50 rounded-xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-100 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-md translate-x-1 group-hover:translate-x-0">
            Attendance
          </span>
        )}
      </Link>
      <Link
        href="/admin/plans"
        onClick={close}
        className={`${navLinkClass(activePathname === "/admin/plans", isCollapsed)} relative group`}
      >
        <DocIcon className={iconClass} />
        {!isCollapsed && "Plans"}
        {isCollapsed && (
          <span className="pointer-events-none absolute left-full ml-4 z-50 rounded-xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-100 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-md translate-x-1 group-hover:translate-x-0">
            Plans
          </span>
        )}
      </Link>
      {isAdmin && (
        <Link
          href="/admin/finance"
          onClick={close}
          className={`${navLinkClass(activePathname.startsWith("/admin/finance"), isCollapsed)} relative group`}
        >
          <FinanceIcon className={iconClass} />
          {!isCollapsed && "Finance"}
          {isCollapsed && (
            <span className="pointer-events-none absolute left-full ml-4 z-50 rounded-xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-100 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-md translate-x-1 group-hover:translate-x-0">
              Finance
            </span>
          )}
        </Link>
      )}
      {(isAdmin || userRole === "STAFF") && (
        <Link
          href="/admin/settings"
          onClick={close}
          className={`${navLinkClass(activePathname === "/admin/settings", isCollapsed)} relative group`}
        >
          <SettingsIcon className={iconClass} />
          {!isCollapsed && "Settings"}
          {isCollapsed && (
            <span className="pointer-events-none absolute left-full ml-4 z-50 rounded-xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-100 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-md translate-x-1 group-hover:translate-x-0">
              Settings
            </span>
          )}
        </Link>
      )}
    </nav>
  );
}

function HomeIcon({
  className = "h-4 w-4 shrink-0",
}: { className?: string } = {}) {
  return <Home className={className} strokeWidth={2} />;
}

export function UsersIcon({
  className = "h-4 w-4 shrink-0",
}: { className?: string } = {}) {
  return <Users className={className} strokeWidth={2} />;
}

export function GymIcon({
  className = "h-4 w-4 shrink-0",
}: { className?: string } = {}) {
  return <Dumbbell className={className} strokeWidth={2} />;
}

export function DocIcon({
  className = "h-4 w-4 shrink-0",
}: { className?: string } = {}) {
  return <Calendar className={className} strokeWidth={2} />;
}

export function CheckIcon({
  className = "h-4 w-4 shrink-0 opacity-60",
}: { className?: string } = {}) {
  return <CheckCircle className={className} strokeWidth={2} />;
}

function SettingsIcon({
  className = "h-4 w-4 shrink-0",
}: { className?: string } = {}) {
  return <Settings className={className} strokeWidth={2} />;
}

export function EnquiryIcon({
  className = "h-4 w-4 shrink-0",
}: { className?: string } = {}) {
  return <ClipboardList className={className} strokeWidth={2} />;
}

export function FinanceIcon({
  className = "h-4 w-4 shrink-0",
}: { className?: string } = {}) {
  return <IndianRupee className={className} strokeWidth={2} />;
}

export { HomeIcon, SettingsIcon };
