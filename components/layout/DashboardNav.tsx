"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Home, Users, FileText, CheckCircle, IndianRupee, Settings } from "lucide-react";

export const navLinkClass = (active: boolean, isCollapsed = false) =>
  `flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"} rounded-lg ${isCollapsed ? "px-2" : "px-3"} py-2.5 text-sm font-medium transition-colors ${
    active
      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-50"
  }`;

const disabledClass =
  "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 dark:text-zinc-600 cursor-not-allowed";

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

  return (
    <nav className={`space-y-4 ${isCollapsed ? "p-1.5" : "p-3"}`}>
      {!isCollapsed && (
        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Main</p>
          <div className="space-y-0.5">
            <Link
              href="/dashboard"
              onClick={close}
              className={navLinkClass(pathname === "/dashboard", isCollapsed)}
              title={isCollapsed ? "Dashboard" : undefined}
            >
              <HomeIcon />
              {!isCollapsed && "Dashboard"}
            </Link>
          </div>
        </div>
      )}

      <div>
        {!isCollapsed ? (
          <p className="px-3 mb-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Operations</p>
        ) : (
          <div className="border-t border-zinc-200 dark:border-zinc-800 my-3" />
        )}
        <div className="space-y-0.5">
          <Link
            href="/students"
            onClick={close}
            className={navLinkClass(pathname.startsWith("/students"), isCollapsed)}
            title={isCollapsed ? "Students" : undefined}
          >
            <UsersIcon />
            {!isCollapsed && "Students"}
          </Link>
          <Link
            href="/plans"
            onClick={close}
            className={navLinkClass(pathname === "/plans", isCollapsed)}
            title={isCollapsed ? "Plans" : undefined}
          >
            <DocIcon />
            {!isCollapsed && "Plans"}
          </Link>
          <DisabledItem icon={<CheckIcon />} label="Attendance" isCollapsed={isCollapsed} />
          <DisabledItem icon={<CurrencyIcon />} label="Fees" isCollapsed={isCollapsed} />
        </div>
      </div>

      {isAdmin && (
        <div>
          {!isCollapsed ? (
            <p className="px-3 mb-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Admin</p>
          ) : (
            <div className="border-t border-zinc-200 dark:border-zinc-800 my-3" />
          )}
          <div className="space-y-0.5">
            <Link
              href="/settings"
              onClick={close}
              className={navLinkClass(pathname === "/settings", isCollapsed)}
              title={isCollapsed ? "Settings" : undefined}
            >
              <SettingsIcon />
              {!isCollapsed && "Settings"}
            </Link>
          </div>
        </div>
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
      className={`${disabledClass} ${isCollapsed ? "justify-center px-2" : ""}`}
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

function HomeIcon() {
  return <Home className="h-4 w-4 shrink-0" strokeWidth={2} />;
}

export function UsersIcon() {
  return <Users className="h-4 w-4 shrink-0" strokeWidth={2} />;
}

function DocIcon() {
  return <FileText className="h-4 w-4 shrink-0" strokeWidth={2} />;
}

function CheckIcon() {
  return <CheckCircle className="h-4 w-4 shrink-0 opacity-60" strokeWidth={2} />;
}

function CurrencyIcon() {
  return <IndianRupee className="h-4 w-4 shrink-0 opacity-60" strokeWidth={2} />;
}

function SettingsIcon() {
  return <Settings className="h-4 w-4 shrink-0" strokeWidth={2} />;
}

export { HomeIcon, SettingsIcon };
