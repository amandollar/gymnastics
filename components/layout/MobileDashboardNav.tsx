"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardNav, { HomeIcon, SettingsIcon, UsersIcon, EnquiryIcon } from "./DashboardNav";
import { Menu, X, LogOut } from "lucide-react";

export function MobileMenuButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="md:hidden -ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" strokeWidth={2} />
    </button>
  );
}

export function MobileNavDrawer({
  open,
  onClose,
  isAdmin,
}: {
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/40 dark:bg-zinc-950/60 cursor-pointer"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 flex w-[min(100%,280px)] flex-col bg-white dark:bg-zinc-950 shadow-xl">
        <div className="flex h-14 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/logo.webp"
              alt="TAG"
              className="h-8 w-8 rounded-full border border-zinc-200 dark:border-zinc-800 object-cover shrink-0"
            />
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">TAG CRM</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <DashboardNav pathname={pathname} isAdmin={isAdmin} onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}

export function MobileBottomNav({
  isAdmin,
  signOutAction,
}: {
  isAdmin: boolean;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div
        className={`grid h-14 ${
          isAdmin ? "grid-cols-5" : "grid-cols-4"
        }`}
      >
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
            pathname === "/dashboard" ? "text-brand-orange-500" : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <HomeIcon />
          Home
        </Link>
        <Link
          href="/students"
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
            pathname.startsWith("/students")
              ? "text-brand-orange-500"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <UsersIcon />
          Students
        </Link>
        <Link
          href="/enquiries"
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
            pathname.startsWith("/enquiries")
              ? "text-brand-orange-500"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <EnquiryIcon />
          Enquiries
        </Link>
        {isAdmin && (
          <Link
            href="/settings"
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
              pathname === "/settings" ? "text-brand-orange-500" : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <SettingsIcon />
            Settings
          </Link>
        )}
        <form action={signOutAction} className="flex flex-col items-center justify-center">
          <button
            type="submit"
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 w-full h-full cursor-pointer hover:text-brand-orange-500 transition-colors"
          >
            <LogOut className="h-5 w-5" strokeWidth={2} />
            Sign Out
          </button>
        </form>
      </div>
    </nav>
  );
}
