"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import type { PricingMaps } from "@/lib/plan/pricing-defaults";
import { Settings, X } from "lucide-react";
import CreateAssignPlanPanel from "./CreateAssignPlanPanel";
import PricingRatesPanel from "./PricingRatesPanel";
import type { PlanStudentOption } from "./StudentPicker";

export default function PlansPageClient({
  students,
  pricingMaps,
  isAdmin,
  canManage,
}: {
  students: PlanStudentOption[];
  pricingMaps: PricingMaps;
  isAdmin: boolean;
  canManage: boolean;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="space-y-6 min-w-0 max-w-3xl">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Plans</h1>
        {canManage && (
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <Settings className="h-4 w-4 text-zinc-500" />
            <span>Settings</span>
          </button>
        )}
      </header>

      <div>
        <Suspense
          fallback={
            <div className="h-40 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          }
        >
          <CreateAssignPlanPanel
            students={students}
            pricingMaps={pricingMaps}
            canManage={canManage}
          />
        </Suspense>
      </div>

      {canManage && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          You can also assign from a student profile under{" "}
          <Link href="/students" className="text-zinc-600 dark:text-zinc-400 hover:underline">
            Students
          </Link>
          .
        </p>
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-zinc-900 border-0 shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-4 mb-4 shrink-0">
              <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                Plan Pricing Settings
              </h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto pr-1">
              <PricingRatesPanel pricingMaps={pricingMaps} isAdmin={isAdmin} />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-4 shrink-0">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
