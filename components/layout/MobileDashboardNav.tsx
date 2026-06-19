"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardNav, { HomeIcon, SettingsIcon, UsersIcon, EnquiryIcon, GymIcon, DocIcon, CheckIcon } from "./DashboardNav";
import { Menu, X } from "lucide-react";

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
  signOutAction: _signOutAction,
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
        className="flex h-14 items-center overflow-x-auto scrollbar-none px-2 gap-1"
      >
        <Link
          href="/admin/dashboard"
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium flex-1 min-w-[68px] shrink-0 ${
            pathname === "/admin/dashboard" ? "text-brand-orange-500" : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <HomeIcon className="h-4.5 w-4.5 shrink-0" />
          Dashboard
        </Link>
        <Link
          href="/admin/enquiries"
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium flex-1 min-w-[68px] shrink-0 ${
            pathname.startsWith("/admin/enquiries")
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
            pathname.startsWith("/admin/students")
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
            pathname.startsWith("/admin/coaches")
              ? "text-brand-orange-500"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <GymIcon className="h-4.5 w-4.5 shrink-0" />
          Coaches
        </Link>
        <Link
          href="/admin/attendance"
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium flex-1 min-w-[68px] shrink-0 ${
            pathname.startsWith("/admin/attendance")
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
            pathname === "/admin/plans" ? "text-brand-orange-500" : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <DocIcon className="h-4.5 w-4.5 shrink-0" />
          Plans
        </Link>
        {isAdmin && (
          <Link
            href="/admin/settings"
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium flex-1 min-w-[68px] shrink-0 ${
              pathname === "/admin/settings" ? "text-brand-orange-500" : "text-zinc-500 dark:text-zinc-400"
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
