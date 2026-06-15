"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import StudentAvatar from "./StudentAvatar";
import BasicDetailsTab from "./BasicDetailsTab";
import UpdatePlanTab from "./UpdatePlanTab";
import type { PlanTypeKey, WeekdayName } from "@/lib/plan/calculations";
import type { BatchWithCount } from "@/lib/services/batches";

type StudentPlanData = {
  id: string;
  planType: PlanTypeKey;
  startDate: string | Date;
  endDate: string | Date;
  selectedDays: WeekdayName[];
  graceDays: number;
  fee: number;
  totalSessions: number;
  discountPercent: number;
  batchId?: string | null;
} | null;

type StudentData = {
  id: string;
  name: string;
  dateOfBirth: Date;
  gender: string;
  parentName: string;
  contactNumber: string;
  admissionDate: Date;
  notes: string | null;
  medicalHistory: string | null;
  avatarUrl?: string | null;
  studentNumber: number;
  status?: string;
  activePlan?: StudentPlanData;
};

export default function EditStudentForm({
  student,
  pricingMaps,
  gracePeriodMap = {},
  batches = [],
}: {
  student: StudentData;
  pricingMaps: any;
  gracePeriodMap?: any;
  batches?: BatchWithCount[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = searchParams.get("tab") === "plan" ? "plan" : "basic";
  const [activeTab, setActiveTab] = useState<"basic" | "plan">(initialTab);

  // Sync tab if URL changes externally
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "plan" || tabParam === "basic") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: "basic" | "plan") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-1 pb-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/students/${student.id}`}
            className="inline-flex items-center gap-1.5 text-zinc-900 dark:text-zinc-50 hover:text-brand-orange-500 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
              Edit Student
            </h1>
          </Link>
        </div>

        {/* Right: name + avatar */}
        <Link
          href={`/students/${student.id}`}
          className="flex items-center gap-2 hover:opacity-85 transition-opacity"
        >
          <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {student.name}
          </span>
          <StudentAvatar student={student} size={32} />
        </Link>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-2xl p-1 bg-zinc-100 dark:bg-zinc-800 max-w-md mx-auto w-full">
        <button
          type="button"
          onClick={() => handleTabChange("basic")}
          className={`flex-1 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === "basic"
              ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-750 dark:hover:text-zinc-200"
          }`}
        >
          Basic Details
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("plan")}
          className={`flex-1 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === "plan"
              ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-750 dark:hover:text-zinc-200"
          }`}
        >
          Update Plan
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "basic" && <BasicDetailsTab student={student} />}

      {activeTab === "plan" && (
        <div className="max-w-3xl mx-auto">
          {!student.activePlan ? (
            <div className="rounded-3xl bg-white dark:bg-zinc-900 p-8 shadow-xs text-center space-y-3">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                No active plan found for this student.
              </p>
              <Link
                href={`/students/${student.id}`}
                className="inline-flex items-center justify-center rounded-xl bg-brand-orange-500 px-4.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-orange-600 transition-colors"
              >
                Go to profile to assign a plan
              </Link>
            </div>
          ) : (
            <UpdatePlanTab
              studentId={student.id}
              activePlan={student.activePlan}
              pricingMaps={pricingMaps}
              gracePeriodMap={gracePeriodMap}
              batches={batches}
            />
          )}
        </div>
      )}
    </div>
  );
}
