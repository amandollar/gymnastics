"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { assignPlanFromPlansPageAction } from "@/lib/actions/students";
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

  useEffect(() => {
    if (preselectId) setStudentId(preselectId);
  }, [preselectId]);

  const [state, action, pending] = useActionState(
    assignPlanFromPlansPageAction,
    null
  );

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

  if (state?.success && selectedStudent) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-emerald-900">Plan saved</h2>
          <p className="mt-1 text-sm text-emerald-800">
            {selectedStudent.name} now has an active plan. {state.message}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/students/${studentId}`}
            className="inline-flex justify-center rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            View student profile
          </Link>
          <Link
            href="/plans"
            className="inline-flex justify-center rounded-xl border border-emerald-300 bg-white px-5 py-2.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100/50"
          >
            Assign another plan
          </Link>
        </div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
        Only managers and admins can assign plans. You can still view class rates in the
        settings tab.
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
    <form action={action} onSubmit={handleSubmit} className="space-y-8">
      <input type="hidden" name="studentId" value={studentId} readOnly />
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
            1
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-zinc-900">Who is this plan for?</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              Pick the student. New child?{" "}
              <Link href="/students/new" className="text-brand-orange-600 font-medium hover:underline">
                Add student
              </Link>{" "}
              first, then come back here.
            </p>
          </div>
        </div>
        <StudentPicker
          students={students}
          value={studentId}
          onChange={(id) => {
            setStudentId(id);
            setStudentError(undefined);
          }}
          error={studentError}
        />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
            2
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-zinc-900">Build the plan</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              Set class type, dates, and weekly days. Fee updates automatically — no spreadsheet needed.
            </p>
          </div>
        </div>
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
      </section>

      <section className="rounded-2xl border-2 border-brand-orange-200 bg-gradient-to-br from-orange-50/80 to-white p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Ready to save?</h2>
            <p className="text-sm text-zinc-600 mt-0.5">
              {selectedStudent
                ? `This will assign the plan to ${selectedStudent.name}. Any current active plan will be replaced.`
                : "Select a student and complete the plan details above."}
            </p>
          </div>
          <button
            type="submit"
            disabled={
              pending ||
              !studentId ||
              !preview ||
              preview.totalSessions === 0
            }
            className="shrink-0 rounded-xl bg-brand-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-orange-600 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {pending ? "Saving…" : "Save plan to student"}
          </button>
        </div>
        {state?.message && !state.success && (
          <p className="mt-3 text-sm text-rose-600">{state.message}</p>
        )}
      </section>
    </form>
  );
}
