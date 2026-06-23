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
import type { GracePeriodMap } from "@/lib/plan/grace-period-utils";
import type { BatchWithCount } from "@/lib/services/batches";
import { parseDateInput, toDateInputValue } from "@/lib/utils/student";
import PlanBuilderFields from "./PlanBuilderFields";
import StudentPicker, { type PlanStudentOption } from "./StudentPicker";
import BatchPicker from "./BatchPicker";
import CoachPicker, { type CoachOption } from "./CoachPicker";
import { planInputClass } from "./plan-form-shared";

function parseDaysFromBatchName(name: string): WeekdayName[] | null {
  const words = name.trim().split(/\s+/);
  if (words.length === 0) return null;
  const lastWord = words[words.length - 1];

  // Must consist only of uppercase letters
  if (!/^[A-Z]+$/.test(lastWord)) {
    return null;
  }

  const daysInfo: { char: string; name: WeekdayName }[] = [
    { char: "M", name: "Monday" },
    { char: "T", name: "Tuesday" },
    { char: "W", name: "Wednesday" },
    { char: "T", name: "Thursday" },
    { char: "F", name: "Friday" },
    { char: "S", name: "Saturday" },
    { char: "S", name: "Sunday" },
  ];

  const selected: WeekdayName[] = [];
  let searchIndex = 0;

  for (let i = 0; i < lastWord.length; i++) {
    const char = lastWord[i];
    let foundIndex = -1;
    for (let j = searchIndex; j < daysInfo.length; j++) {
      if (daysInfo[j].char === char) {
        foundIndex = j;
        break;
      }
    }

    if (foundIndex !== -1) {
      selected.push(daysInfo[foundIndex].name);
      searchIndex = foundIndex + 1;
    }
  }

  return selected.length > 0 ? selected : null;
}

export default function CreateAssignPlanPanel({
  students,
  pricingMaps,
  gracePeriodMap,
  batches,
  coaches,
  canManage,
  onOpenBatchesModal,
}: {
  students: PlanStudentOption[];
  pricingMaps: PricingMaps;
  gracePeriodMap: GracePeriodMap;
  batches: BatchWithCount[];
  coaches: CoachOption[];
  canManage: boolean;
  onOpenBatchesModal?: () => void;
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
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedCoachId, setSelectedCoachId] = useState("");
  const [commissionPercent, setCommissionPercent] = useState(50);
  const [studentError, setStudentError] = useState<string | undefined>();
  const [batchError, setBatchError] = useState<string | undefined>();
  const [coachError, setCoachError] = useState<string | undefined>();
  const [showSuccess, setShowSuccess] = useState(false);

  const isPersonalTraining = planType === "ONE_TO_ONE";

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

  // When switching plan type, reset the type-specific fields
  useEffect(() => {
    if (isPersonalTraining) {
      setSelectedBatchId("");
      setBatchError(undefined);
    } else {
      setSelectedCoachId("");
      setCoachError(undefined);
    }
  }, [isPersonalTraining]);

  function resetForm() {
    setShowSuccess(false);
    setStudentId(preselectId);
    setPlanType("REGULAR");
    setStartDate(today);
    setEndDate("");
    setSelectedDays([]);
    setDiscountPercent(0);
    setSelectedBatchId("");
    setSelectedCoachId("");
    setCommissionPercent(50);
    setStudentError(undefined);
    setBatchError(undefined);
    setCoachError(undefined);
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
        gracePeriodMap,
      });
    } catch {
      return null;
    }
  }, [planType, startDate, endDate, selectedDays, discountPercent, pricingMaps, gracePeriodMap]);

  function toggleDay(day: WeekdayName) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  const handleBatchChange = (id: string) => {
    setSelectedBatchId(id);
    setBatchError(undefined);
    const batch = batches.find((b) => b.id === id);
    if (batch) {
      const autoDays = parseDaysFromBatchName(batch.name);
      if (autoDays) {
        setSelectedDays(autoDays);
      }
    }
  };

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
            href={`/admin/students/${studentId}`}
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
    let hasError = false;

    if (!studentId) {
      e.preventDefault();
      setStudentError("Please select a student first");
      hasError = true;
    } else {
      setStudentError(undefined);
    }

    if (!isPersonalTraining && !selectedBatchId) {
      e.preventDefault();
      setBatchError("Please select a batch");
      hasError = true;
    } else {
      setBatchError(undefined);
    }

    if (isPersonalTraining && !selectedCoachId) {
      e.preventDefault();
      setCoachError("Please select a coach for personal training");
      hasError = true;
    } else {
      setCoachError(undefined);
    }

    if (hasError) return;
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input type="hidden" name="studentId" value={studentId} readOnly />
      <input type="hidden" name="batchId" value={selectedBatchId} readOnly />
      <input type="hidden" name="coachId" value={selectedCoachId} readOnly />

      <div className="rounded-3xl bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="p-5 sm:p-6 space-y-6">
          {/* Student selection */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
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

          {/* Plan builder (includes plan type toggle) */}
          <div>
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
            >
              {/* Conditional: Batch (REGULAR) or Coach (ONE_TO_ONE) */}
              {isPersonalTraining ? (
                <div className="space-y-3 animate-fade-in">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        Coach
                      </p>
                      <CoachPicker
                        coaches={coaches}
                        value={selectedCoachId}
                        onChange={(id) => {
                          setSelectedCoachId(id);
                          setCoachError(undefined);
                        }}
                        error={coachError}
                      />
                      {coaches.filter((c) => c.status === "WORKING").length === 0 && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          No working coaches available.{" "}
                          <Link href="/admin/coaches" className="text-brand-orange-500 hover:underline">
                            Add a coach first.
                          </Link>
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        PT Commission Share (%)
                      </p>
                      <input
                        name="commissionPercent"
                        type="number"
                        min={0}
                        max={100}
                        value={commissionPercent}
                        onChange={(e) => setCommissionPercent(parseInt(e.target.value) || 0)}
                        className={planInputClass}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                      {batches.length === 0 ? "No batches added" : "Batch"}
                    </p>
                    {batches.length === 0 && onOpenBatchesModal && (
                      <button
                        type="button"
                        onClick={onOpenBatchesModal}
                        className="inline-flex items-center justify-center rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                      >
                        Create Batch
                      </button>
                    )}
                  </div>
                  <BatchPicker
                    batches={batches}
                    value={selectedBatchId}
                    onChange={handleBatchChange}
                    error={batchError}
                    onManageBatches={onOpenBatchesModal}
                  />
                </div>
              )}
            </PlanBuilderFields>
          </div>
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
              (!isPersonalTraining && !selectedBatchId) ||
              (isPersonalTraining && !selectedCoachId) ||
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
