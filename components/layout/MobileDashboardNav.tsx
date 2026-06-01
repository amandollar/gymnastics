"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardNav, { HomeIcon, SettingsIcon } from "./DashboardNav";

export function MobileMenuButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="md:hidden -ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-100 cursor-pointer"
      aria-label="Open menu"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      </svg>
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
        className="absolute inset-0 bg-zinc-900/40 cursor-pointer"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 flex w-[min(100%,280px)] flex-col bg-white shadow-xl">
        <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/logo.webp"
              alt="TAG"
              className="h-8 w-8 rounded-full border border-zinc-200 object-cover shrink-0"
            />
            <span className="text-sm font-semibold text-zinc-900 truncate">TAG CRM</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 cursor-pointer"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <DashboardNav pathname={pathname} isAdmin={isAdmin} onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}

export function MobileBottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className={`grid ${isAdmin ? "grid-cols-2" : "grid-cols-1"} h-14`}>
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
            pathname === "/dashboard" ? "text-brand-orange-500" : "text-zinc-500"
          }`}
        >
          <HomeIcon />
          Dashboard
        </Link>
        {isAdmin && (
          <Link
            href="/settings"
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
              pathname === "/settings" ? "text-brand-orange-500" : "text-zinc-500"
            }`}
          >
            <SettingsIcon />
            Users
          </Link>
        )}
      </div>
    </nav>
  );
}
