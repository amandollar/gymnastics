"use client";

import { useState } from "react";
import RoleBadge from "./RoleBadge";
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
      <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-2 border-b border-zinc-200 bg-white px-3 sm:px-6 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MobileMenuButton onOpen={() => setMenuOpen(true)} />
          <img
            src="/logo.webp"
            alt="TAG"
            className="md:hidden h-7 w-7 shrink-0 rounded-full border border-zinc-200 object-cover"
          />
          <span className="md:hidden truncate text-sm font-semibold text-zinc-900">
            TAG CRM
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="hidden sm:flex sm:items-center sm:gap-3">
            <div className="text-right max-w-[140px] lg:max-w-none">
              <p className="text-sm font-medium text-zinc-900 truncate">
                {userName}
              </p>
              <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
            </div>
            <RoleBadge role={userRole} />
          </div>

          <div
            className="sm:hidden flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600"
            title={userName}
          >
            {initials}
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer sm:px-3"
              aria-label="Sign out"
            >
              <span className="hidden sm:inline">Sign out</span>
              <svg
                className="h-4 w-4 sm:hidden"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
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
