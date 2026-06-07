"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { assignPlanFromPlansPageAction } from "@/lib/actions/students";
import { Check, ArrowRight } from "lucide-react";
import {
  computePlanFields,
  type PlanTypeKey,
  type WeekdayName,
} from "@/lib/plan/calculations";
import type { PricingMaps } from "@/lib/plan/pricing-defaults";
import { parseDateInput, toDateInputValue } from "@/lib/utils/student";
import PlanBuilderFields from "./PlanBuilderFields";
import StudentPicker, { type PlanStudentOption } from "./StudentPicker";

export default function CreateAssignPlanPanel({
  students,
  pricingMaps,
  canManage,
}: {
  students: PlanStudentOption[];
  pricingMaps: PricingMaps;
  canManage: boolean;
}) {
  const searchParams = useSearchParams();
  const preselectId = searchParams.get("student") ?? "";

  const today = toDateInputValue(new Date());
  const [studentId, setStudentId] = useState(preselectId);
  const [planType, setPlanType] = useState<PlanTypeKey>("REGULAR");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState("");
  const [selectedDays, setSelectedDays] = useState<WeekdayName[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [studentError, setStudentError] = useState<string | undefined>();
  const [showSuccess, setShowSuccess] = useState(false);

  const [state, action, pending] = useActionState(
    assignPlanFromPlansPageAction,
    null
  );

  useEffect(() => {
    if (preselectId) setStudentId(preselectId);
  }, [preselectId]);

  useEffect(() => {
    if (state?.success) setShowSuccess(true);
  }, [state?.success]);

  function resetForm() {
    setShowSuccess(false);
    setStudentId(preselectId);
    setPlanType("REGULAR");
    setStartDate(today);
    setEndDate("");
    setSelectedDays([]);
    setDiscountPercent(0);
    setStudentError(undefined);
  }

  const preview = useMemo(() => {
    if (!startDate || !endDate || selectedDays.length === 0) return null;
    try {
      const start = parseDateInput(startDate);
      const end = parseDateInput(endDate);
      if (end < start) return null;
      return computePlanFields({
        planType,
        startDate: start,
        endDate: end,
        selectedDays,
        discountPercent,
        pricingMaps,
      });
    } catch {
      return null;
    }
  }, [planType, startDate, endDate, selectedDays, discountPercent, pricingMaps]);

  function toggleDay(day: WeekdayName) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  const selectedStudent = students.find((s) => s.id === studentId);

  if (showSuccess && selectedStudent) {
    return (
      <div className="rounded-3xl bg-white dark:bg-zinc-900 p-8 text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
          <Check className="h-7 w-7" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Plan saved!</h2>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            {selectedStudent.name} now has an active plan.
            {state?.message && <span> {state.message}</span>}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-1">
          <Link
            href={`/students/${studentId}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-orange-600 transition-colors"
          >
            View student profile
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex justify-center rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-transparent px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Assign another plan
          </button>
        </div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="rounded-3xl bg-white dark:bg-zinc-900 px-5 py-4 text-sm text-zinc-500 dark:text-zinc-400">
        Only managers and admins can assign plans.
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!studentId) {
      e.preventDefault();
      setStudentError("Please select a student first");
      return;
    }
    setStudentError(undefined);
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input type="hidden" name="studentId" value={studentId} readOnly />

      <div className="rounded-3xl bg-white dark:bg-zinc-900 overflow-hidden">
        {/* Student selection */}
        <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
            Student
          </p>
          <StudentPicker
            students={students}
            value={studentId}
            onChange={(id) => {
              setStudentId(id);
              setStudentError(undefined);
            }}
            error={studentError}
          />
        </div>

        {/* Plan builder */}
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <PlanBuilderFields
            formMode
            planType={planType}
            onPlanTypeChange={setPlanType}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            selectedDays={selectedDays}
            onToggleDay={toggleDay}
            discountPercent={discountPercent}
            onDiscountChange={setDiscountPercent}
            preview={preview}
            selectedDaysError={state?.errors?.selectedDays?.[0]}
          />
        </div>

        {/* Submit footer */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 sm:px-6 py-4 flex items-center justify-between gap-4 bg-zinc-50/60 dark:bg-zinc-800/30">
          <div>
            {state?.message && !state.success && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{state.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={
              pending ||
              !studentId ||
              !preview ||
              preview.totalSessions === 0
            }
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-orange-500 hover:bg-brand-orange-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer px-5 py-2.5 text-sm font-semibold text-white transition-colors shrink-0"
          >
            {pending ? "Saving…" : "Save plan"}
            {!pending && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </form>
  );
}
