"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import type { PricingMaps } from "@/lib/plan/pricing-defaults";
import CreateAssignPlanPanel from "./CreateAssignPlanPanel";
import PricingRatesPanel from "./PricingRatesPanel";
import type { PlanStudentOption } from "./StudentPicker";

type TabId = "assign" | "rates";

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
  const [tab, setTab] = useState<TabId>("assign");

  return (
    <div className="space-y-6 min-w-0 max-w-3xl">
      <header>
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900">Plans</h1>
        <p className="mt-2 text-sm text-zinc-600 leading-relaxed max-w-xl">
          Create a plan, see the fee, and assign it to a student — all in one place.
          You do not need the Excel sheet anymore.
        </p>
      </header>

      <div
        role="tablist"
        className="inline-flex gap-1 p-1 rounded-xl bg-zinc-100"
        aria-label="Plans sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "assign"}
          onClick={() => setTab("assign")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
            tab === "assign"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Create & assign
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "rates"}
          onClick={() => setTab("rates")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
            tab === "rates"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Class rates
        </button>
      </div>

      <div role="tabpanel">
        {tab === "assign" && (
          <Suspense
            fallback={
              <div className="h-40 rounded-xl bg-zinc-100 animate-pulse" />
            }
          >
            <CreateAssignPlanPanel
              students={students}
              pricingMaps={pricingMaps}
              canManage={canManage}
            />
          </Suspense>
        )}
        {tab === "rates" && (
          <PricingRatesPanel pricingMaps={pricingMaps} isAdmin={isAdmin} />
        )}
      </div>

      {tab === "assign" && canManage && (
        <p className="text-xs text-zinc-400">
          You can also assign from a student profile under{" "}
          <Link href="/students" className="text-zinc-600 hover:underline">
            Students
          </Link>
          .
        </p>
      )}
    </div>
  );
}
