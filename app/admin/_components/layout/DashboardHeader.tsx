"use client";

import { useState } from "react";
import RoleBadge from "./RoleBadge";
import { LogOut } from "lucide-react";
import {
  MobileMenuButton,
  MobileNavDrawer,
} from "./MobileDashboardNav";

export default function DashboardHeader({
  userName,
  userEmail,
  userRole,
  isAdmin,
  signOutAction,
}: {
  userName: string;
  userEmail: string;
  userRole: string;
  isAdmin: boolean;
  signOutAction: () => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 sm:px-6 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MobileMenuButton onOpen={() => setMenuOpen(true)} />
          <img
            src="/icons/logo.webp"
            alt="TAG"
            className="md:hidden h-7 w-7 shrink-0 rounded-full border border-zinc-200 dark:border-zinc-800 object-cover"
          />
          <span className="md:hidden truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            TAG CRM
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="hidden sm:flex sm:items-center sm:gap-3">
            <div className="text-right max-w-[140px] lg:max-w-none">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {userName}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{userEmail}</p>
            </div>
            <RoleBadge role={userRole} />
          </div>

          <div
            className="sm:hidden flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300"
            title={userName}
          >
            {initials}
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer sm:px-3"
              aria-label="Sign out"
            >
              <span className="hidden sm:inline">Sign out</span>
              <LogOut className="h-4 w-4 sm:hidden" strokeWidth={2} aria-hidden />
            </button>
          </form>
        </div>
      </header>

      <MobileNavDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        isAdmin={isAdmin}
      />
    </>
  );
}
