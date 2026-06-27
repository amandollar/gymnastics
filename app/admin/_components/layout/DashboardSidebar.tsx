"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import DashboardNav from "./DashboardNav";
import ThemeSelector from "./ThemeSelector";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

export default function DashboardSidebar({
  isAdmin,
  userName,
  userRole,
  signOutAction,
}: {
  isAdmin: boolean;
  userName: string;
  userRole: string;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("sidebar-collapsed", String(nextState));
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isUserAdmin = userRole === "ADMIN" || userRole === "SUPER" || userRole === "SUPER_ADMIN";
  const avatarSrc = isUserAdmin
    ? "/icons/admin-profile-placeholder.webp"
    : "/icons/staff-profile-placeholder.webp";
  const displayRole = isUserAdmin ? "Admin" : userRole === "STAFF" ? "Staff" : userRole;

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 h-[calc(100vh-24px)] my-3 ml-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shadow-xs transition-all duration-300 sticky top-3 z-20 ${
        isCollapsed ? "w-16 overflow-visible" : "w-60 overflow-hidden"
      }`}
    >
      {/* Top Header Row */}
      <div className={`flex h-14 items-center px-4 ${
        isCollapsed ? "justify-center" : "justify-between gap-2.5"
      }`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/icons/logo.webp"
                alt="TAG"
                className="h-8 w-8 rounded-full border border-zinc-200 dark:border-zinc-800 object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">TAG CRM</p>
              </div>
            </div>

            {/* Collapse Button */}
            <button
              onClick={toggleCollapse}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4.5 w-4.5" strokeWidth={2} />
            </button>
          </>
        ) : (
          /* Expand Button when collapsed */
          <button
            onClick={toggleCollapse}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Centered Logo below top header when collapsed */}
      {isCollapsed && (
        <div className="flex justify-center pt-4 pb-2">
          <Link
            href="/dashboard"
            className="transition-transform hover:scale-105 active:scale-95 shrink-0 block"
            title="Dashboard"
          >
            <img
              src="/icons/logo.webp"
              alt="TAG"
              className="h-8 w-8 rounded-full border border-zinc-200 dark:border-zinc-800 object-cover shrink-0"
            />
          </Link>
        </div>
      )}

      {/* Nav List */}
      <div className={`flex-1 pt-2 ${isCollapsed ? "overflow-visible" : "overflow-y-auto"}`}>
        <DashboardNav pathname={pathname} isAdmin={isAdmin} userRole={userRole} isCollapsed={isCollapsed} />
      </div>

      {/* Theme Selector */}
      <ThemeSelector isCollapsed={isCollapsed} />

      {/* Bottom User Card */}
      <div className={`p-3 flex items-center ${
        isCollapsed ? "justify-center" : "gap-3"
      }`}>
        <div className="flex items-center gap-3 min-w-0 relative group">
          <img
            src={avatarSrc}
            alt={displayRole}
            className={`shrink-0 rounded-full object-cover ${
              isCollapsed ? "h-11 w-11" : "h-[61px] w-[61px]"
            }`}
          />
          {isCollapsed && (
            <span className="pointer-events-none absolute left-full ml-4 z-50 rounded-xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-100 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-md translate-x-1 group-hover:translate-x-0">
              {userName} ({displayRole})
            </span>
          )}
          {!isCollapsed && (
            <div className="min-w-0 flex flex-col justify-center">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                {displayRole}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                {userName}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
