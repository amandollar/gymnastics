"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { PricingMaps } from "@/lib/plan/pricing-defaults";
import type { GracePeriodMap } from "@/lib/plan/grace-period-utils";
import type { BatchWithCount } from "@/lib/services/batches";
import type { CoachOption } from "./CoachPicker";
import { Settings, X } from "lucide-react";
import CreateAssignPlanPanel from "./CreateAssignPlanPanel";
import PricingRatesPanel from "./PricingRatesPanel";
import type { PlanStudentOption } from "./StudentPicker";

export default function PlansPageClient({
  students,
  pricingMaps,
  gracePeriodMap,
  batches: initialBatches,
  coaches,
  isAdmin,
  canManage,
}: {
  students: PlanStudentOption[];
  pricingMaps: PricingMaps;
  gracePeriodMap: GracePeriodMap;
  batches: BatchWithCount[];
  coaches: CoachOption[];
  isAdmin: boolean;
  canManage: boolean;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const headerMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!headerMenuOpen) return;
    function clickHandler(e: MouseEvent) {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        const toggleButton = headerMenuRef.current.parentElement?.querySelector("button");
        if (toggleButton && !toggleButton.contains(e.target as Node)) {
          setHeaderMenuOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", clickHandler);
    return () => document.removeEventListener("mousedown", clickHandler);
  }, [headerMenuOpen]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-5 min-w-0 w-full relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg animate-fade-in ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30"
              : "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-900/30"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-zinc-955 dark:text-zinc-50">Allot plan</h1>
        {canManage && (
          <div className="relative">
            {/* Desktop View: Action Buttons */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              {/* Manage Batches link */}
              <Link
                href="/admin/settings?tab=batches"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <span>Manage Batch</span>
              </Link>

              {/* Pricing & Grace button */}
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <span>Fee &amp; Grace</span>
              </button>
            </div>

            {/* Mobile View: Three-dot menu */}
            <div className="sm:hidden relative">
              <button
                type="button"
                onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
                className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-200 cursor-pointer transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
              {headerMenuOpen && (
                <nav
                  ref={headerMenuRef}
                  className="absolute right-0 mt-2 w-48 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-2xl py-1.5 overflow-hidden z-50 animate-scale-in origin-top-right"
                >
                  <Link
                    href="/admin/settings?tab=batches"
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer font-medium"
                  >
                    Manage Batches
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      setSettingsOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer font-medium"
                  >
                    Pricing &amp; Grace
                  </button>
                </nav>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main form panel */}
      <div className="max-w-2xl">
        <Suspense
          fallback={
            <div className="h-64 rounded-3xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          }
        >
          <CreateAssignPlanPanel
            students={students}
            pricingMaps={pricingMaps}
            gracePeriodMap={gracePeriodMap}
            batches={initialBatches}
            coaches={coaches}
            canManage={canManage}
          />
        </Suspense>
      </div>

      {canManage && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 px-1">
          You can also assign plans from a student&apos;s profile under{" "}
          <Link href="/admin/students" className="text-zinc-500 dark:text-zinc-400 hover:underline underline-offset-2">
            Students
          </Link>
          .
        </p>
      )}



      {/* Settings Modal — Pricing & Grace */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setSettingsOpen(false)}
        >
          <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5 shrink-0">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Pricing &amp; Grace Periods</h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto pr-1">
              <PricingRatesPanel
                pricingMaps={pricingMaps}
                gracePeriodMap={gracePeriodMap}
                isAdmin={isAdmin}
                onClose={() => setSettingsOpen(false)}
                onSuccess={(msg) => showToast("success", msg)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
