"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import type { PricingMaps } from "@/lib/plan/pricing-defaults";
import type { GracePeriodMap } from "@/lib/plan/grace-period-utils";
import type { BatchWithCount } from "@/lib/services/batches";
import { Settings, X, Layers } from "lucide-react";
import CreateAssignPlanPanel from "./CreateAssignPlanPanel";
import PricingRatesPanel from "./PricingRatesPanel";
import BatchesPanel from "./BatchesPanel";
import type { PlanStudentOption } from "./StudentPicker";

export default function PlansPageClient({
  students,
  pricingMaps,
  gracePeriodMap,
  batches: initialBatches,
  isAdmin,
  canManage,
}: {
  students: PlanStudentOption[];
  pricingMaps: PricingMaps;
  gracePeriodMap: GracePeriodMap;
  batches: BatchWithCount[];
  isAdmin: boolean;
  canManage: boolean;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [batchesOpen, setBatchesOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-5 min-w-0 max-w-2xl relative">
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
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Assign a plan</h1>
        {canManage && (
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Manage Batches button */}
            <button
              type="button"
              onClick={() => setBatchesOpen(true)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Manage Batches</span>
            </button>

            {/* Pricing & Grace button */}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pricing &amp; Grace</span>
            </button>
          </div>
        )}
      </div>

      {/* Main form panel */}
      <div>
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
            canManage={canManage}
            onOpenBatchesModal={() => setBatchesOpen(true)}
          />
        </Suspense>
      </div>

      {canManage && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 px-1">
          You can also assign plans from a student&apos;s profile under{" "}
          <Link href="/students" className="text-zinc-500 dark:text-zinc-400 hover:underline underline-offset-2">
            Students
          </Link>
          .
        </p>
      )}

      {/* Manage Batches Modal */}
      {batchesOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setBatchesOpen(false)}
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-orange-100 dark:bg-brand-orange-950/40">
                  <Layers className="h-4 w-4 text-brand-orange-600 dark:text-brand-orange-400" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Manage Batches</h3>
              </div>
              <button
                onClick={() => setBatchesOpen(false)}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto pr-1">
              <BatchesPanel
                initialBatches={initialBatches}
                onClose={() => setBatchesOpen(false)}
                onSuccess={(msg) => {
                  showToast("success", msg);
                  // Refresh batches from the server revalidation on next render
                  // The revalidatePath in actions will refresh server-rendered data
                }}
              />
            </div>
          </div>
        </div>
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
