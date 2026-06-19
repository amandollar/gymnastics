"use client";

import { useActionState, useState, useMemo } from "react";
import Link from "next/link";
import { AlertCircle, PlusCircle } from "lucide-react";
import { updateStudentActivePlanAction } from "@/lib/actions/students";
import { toDateInputValue, parseDateInput } from "@/lib/utils/student";
import {
  computePlanFields,
  countSessions,
  type PlanTypeKey,
  type WeekdayName,
} from "@/lib/plan/calculations";
import { PLAN_DAY_OPTIONS } from "@/components/plans/plan-form-shared";
import BatchPicker from "@/components/plans/BatchPicker";
import CoachPicker, { type CoachOption } from "@/components/plans/CoachPicker";
import type { BatchWithCount } from "@/lib/services/batches";
import type { StudentStatus } from "@/lib/utils/student";

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

const inputClass =
  "w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-orange-500/50 focus:border-brand-orange-500 transition-all duration-200";

type ActivePlan = {
  id: string;
  planType: PlanTypeKey;
  startDate: string | Date;
  endDate: string | Date;
  expiryDate: string | Date;
  selectedDays: WeekdayName[];
  graceDays: number;
  fee: number;
  totalSessions: number;
  discountPercent: number;
  batchId?: string | null;
  coachId?: string | null;
};

// ─── Expired Plan Summary Banner ──────────────────────────────────────────────

function ExpiredPlanBanner({
  plan,
  studentId,
}: {
  plan: ActivePlan;
  studentId: string;
}) {
  const startDate = new Date(plan.startDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const endDate = new Date(plan.endDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const expiryDate = new Date(plan.expiryDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const planTypeLabel =
    plan.planType === "REGULAR" ? "Group class" : "Personal training";

  const daysLabel = Array.isArray(plan.selectedDays)
    ? (plan.selectedDays as string[])
        .map((d) => d.slice(0, 3))
        .join(", ")
    : "—";

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Expired banner */}
      <div className="rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/40 mt-0.5">
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-rose-800 dark:text-rose-300">
              Plan Expired
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
              This plan has ended. Grace period expired on {expiryDate}.
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center rounded-full bg-rose-100 dark:bg-rose-900/50 px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-800">
            Expired
          </span>
        </div>

        {/* Plan summary row */}
        <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl bg-white/60 dark:bg-zinc-900/40 border border-rose-100 dark:border-rose-900/30 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-500 dark:text-rose-500 mb-0.5">
              Type
            </p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {planTypeLabel}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-500 dark:text-rose-500 mb-0.5">
              Period
            </p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {startDate} → {endDate}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-500 dark:text-rose-500 mb-0.5">
              Fee
            </p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              ₹{plan.fee.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="col-span-3 border-t border-rose-100 dark:border-rose-900/30 pt-2 mt-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-500 dark:text-rose-500 mb-0.5">
              Class days
            </p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {daysLabel} · {plan.totalSessions} sessions total
            </p>
          </div>
        </div>
      </div>

      {/* Create new plan CTA */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Ready to create a new plan?
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            The previous plan has ended. You can now assign a fresh plan.
          </p>
        </div>
        <Link
          href={`/plans?student=${studentId}`}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          Create new plan
        </Link>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function UpdatePlanTab({
  studentId,
  activePlan,
  pricingMaps,
  gracePeriodMap,
  batches,
  coaches = [],
  planStatus,
}: {
  studentId: string;
  activePlan: ActivePlan;
  pricingMaps: any;
  gracePeriodMap: any;
  batches: BatchWithCount[];
  coaches?: CoachOption[];
  planStatus?: StudentStatus;
}) {
  // If the plan is INACTIVE or EXPIRED, show the expired banner + create new plan CTA
  const isPlanExpired =
    planStatus === "INACTIVE" || planStatus === "EXPIRED";

  if (isPlanExpired) {
    return <ExpiredPlanBanner plan={activePlan} studentId={studentId} />;
  }

  // Otherwise render the editable form (ACTIVE, GRACE, FREEZE)
  return (
    <EditPlanForm
      studentId={studentId}
      activePlan={activePlan}
      pricingMaps={pricingMaps}
      gracePeriodMap={gracePeriodMap}
      batches={batches}
      coaches={coaches}
    />
  );
}

// ─── Edit Plan Form (only shown when plan is ACTIVE / GRACE / FREEZE) ──────────

function EditPlanForm({
  studentId,
  activePlan,
  pricingMaps,
  gracePeriodMap,
  batches,
  coaches = [],
}: {
  studentId: string;
  activePlan: ActivePlan;
  pricingMaps: any;
  gracePeriodMap: any;
  batches: BatchWithCount[];
  coaches?: CoachOption[];
}) {
  const [planType, setPlanType] = useState<PlanTypeKey>(activePlan.planType);
  const [startDate, setStartDate] = useState(
    toDateInputValue(new Date(activePlan.startDate))
  );
  const [endDate, setEndDate] = useState(
    toDateInputValue(new Date(activePlan.endDate))
  );
  const [selectedDays, setSelectedDays] = useState<WeekdayName[]>(
    activePlan.selectedDays as WeekdayName[]
  );
  const [discountPercent, setDiscountPercent] = useState(
    activePlan.discountPercent ?? 0
  );
  const [selectedBatchId, setSelectedBatchId] = useState(
    activePlan.batchId ?? ""
  );
  const [selectedCoachId, setSelectedCoachId] = useState(
    activePlan.coachId ?? ""
  );

  const [state, action, pending] = useActionState(
    updateStudentActivePlanAction.bind(null, studentId),
    null
  );

  function toggleDay(day: WeekdayName) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  const handleBatchChange = (id: string) => {
    setSelectedBatchId(id);
    const batch = batches.find((b) => b.id === id);
    if (batch) {
      const autoDays = parseDaysFromBatchName(batch.name);
      if (autoDays) {
        setSelectedDays(autoDays);
      }
    }
  };

  // Live-calculated plan preview
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

  const sessionCount = useMemo(() => {
    if (!startDate || !endDate || selectedDays.length === 0) return 0;
    try {
      return countSessions(parseDateInput(startDate), parseDateInput(endDate), selectedDays);
    } catch {
      return 0;
    }
  }, [startDate, endDate, selectedDays]);

  const oldFee = activePlan.fee;
  const newFee = preview?.fee ?? oldFee;
  const feeDiff = newFee - oldFee;

  const oldSessions = activePlan.totalSessions;
  const newSessions = preview ? sessionCount : oldSessions;
  const sessionDiff = newSessions - oldSessions;

  return (
    <form action={action} className="space-y-5 max-w-3xl mx-auto">
      <input type="hidden" name="studentPlanId" value={activePlan.id} />
      <input type="hidden" name="planType" value={planType} />
      <input type="hidden" name="discountPercent" value={discountPercent} />
      <input type="hidden" name="batchId" value={selectedBatchId} />
      <input type="hidden" name="coachId" value={selectedCoachId} />
      {selectedDays.map((d) => (
        <input key={d} type="hidden" name="selectedDays" value={d} />
      ))}

      <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-7 transition-colors">

        {/* Plan type */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Plan type
          </label>
          <div className="inline-flex rounded-full p-1 bg-zinc-100 dark:bg-zinc-800">
            {(["REGULAR", "ONE_TO_ONE"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPlanType(t)}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition-all cursor-pointer ${
                  planType === t
                    ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-205"
                }`}
              >
                {t === "REGULAR" ? "Group class" : "Personal training"}
              </button>
            ))}
          </div>
        </div>

        {/* Coach Selection */}
        {planType === "ONE_TO_ONE" && (
          <div className="space-y-2 animate-fade-in">
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Coach
            </label>
            <CoachPicker
              coaches={coaches}
              value={selectedCoachId}
              onChange={setSelectedCoachId}
            />
          </div>
        )}

        {/* Dates */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Start date
            </label>
            <input
              name="startDate"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              End date
            </label>
            <input
              name="endDate"
              type="date"
              required
              min={startDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Class days */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Class days
            {selectedDays.length > 0 && (
              <span className="ml-1.5 font-normal normal-case text-zinc-500">
                ({selectedDays.length}× per week)
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {PLAN_DAY_OPTIONS.map(({ short, name }) => {
              const on = selectedDays.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleDay(name)}
                  className={`min-w-[3.25rem] rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                    on
                      ? "bg-brand-orange-500 text-white shadow-xs"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {short}
                </button>
              );
            })}
          </div>
        </div>

        {/* Discount */}
        <div className="max-w-[200px]">
          <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
            Discount (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={discountPercent}
            onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
            className={inputClass}
          />
        </div>

        {/* Batch */}
        {planType === "REGULAR" && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Batch
            </label>
            {batches.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                No batches created yet.{" "}
                <Link href="/plans" className="text-brand-orange-500 hover:underline">
                  Go to Plans
                </Link>{" "}
                to create one.
              </p>
            ) : (
              <BatchPicker
                batches={batches}
                value={selectedBatchId}
                onChange={handleBatchChange}
              />
            )}
          </div>
        )}
      </div>

      {/* Fee + sessions comparison card */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900 px-6 py-5 shadow-xs transition-colors space-y-5">
        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Plan summary
        </p>

        {/* Aligned comparison table: Current | → | New | Difference */}
        <div className="grid gap-y-5" style={{ gridTemplateColumns: "1fr auto 1fr 1fr" }}>

          {/* ── Column headers ── */}
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 pb-1">Current</span>
          <span /> {/* arrow spacer */}
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 pb-1 pl-8">New</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 pb-1 pl-8">Difference</span>

          {/* ── Fee row ── */}
          <div className="col-span-4 -mt-2 -mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400/70 dark:text-zinc-600">Fee</span>
          </div>

          <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
            ₹{oldFee.toLocaleString("en-IN")}
          </span>

          <span className="self-center px-3 text-zinc-300 dark:text-zinc-600 text-base font-light select-none">→</span>

          <span className={`text-lg font-bold pl-8 ${
            preview
              ? feeDiff > 0
                ? "text-rose-600 dark:text-rose-400"
                : feeDiff < 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-zinc-800 dark:text-zinc-200"
              : "text-zinc-400 dark:text-zinc-600"
          }`}>
            {preview ? `₹${newFee.toLocaleString("en-IN")}` : "—"}
          </span>

          <span className={`text-lg font-bold pl-8 ${
            !preview || feeDiff === 0
              ? "text-zinc-300 dark:text-zinc-700"
              : feeDiff > 0
              ? "text-rose-600 dark:text-rose-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}>
            {!preview
              ? "—"
              : feeDiff === 0
              ? "—"
              : `${feeDiff > 0 ? "+" : ""}₹${feeDiff.toLocaleString("en-IN")}`}
          </span>

          {/* Divider spanning all 4 columns */}
          <div className="col-span-4 border-t border-zinc-100 dark:border-zinc-800" />

          {/* ── Sessions row ── */}
          <div className="col-span-4 -mt-2 -mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400/70 dark:text-zinc-600">Sessions</span>
          </div>

          <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
            {oldSessions}
          </span>

          <span className="self-center px-3 text-zinc-300 dark:text-zinc-600 text-base font-light select-none">→</span>

          <span className={`text-lg font-bold pl-8 ${
            preview
              ? sessionDiff > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : sessionDiff < 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-zinc-800 dark:text-zinc-200"
              : "text-zinc-400 dark:text-zinc-600"
          }`}>
            {preview ? newSessions : "—"}
          </span>

          <span className={`text-lg font-bold pl-8 ${
            !preview || sessionDiff === 0
              ? "text-zinc-300 dark:text-zinc-700"
              : sessionDiff > 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}>
            {!preview
              ? "—"
              : sessionDiff === 0
              ? "—"
              : `${sessionDiff > 0 ? "+" : ""}${sessionDiff}`}
          </span>

        </div>


        {/* Extra info line */}
        {preview && sessionCount > 0 && (
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              Rate per session:{" "}
              <strong className="text-zinc-700 dark:text-zinc-300">
                ₹{Math.round(newFee / sessionCount).toLocaleString("en-IN")}
              </strong>
            </span>
            <span>
              Grace period:{" "}
              <strong className="text-zinc-700 dark:text-zinc-300">{preview.graceDays} days</strong>
            </span>
          </div>
        )}

        {/* Empty state hints */}
        {!preview && selectedDays.length > 0 && startDate && endDate && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Set valid start and end dates to see calculations.
          </p>
        )}
        {selectedDays.length === 0 && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Select class days above to calculate.
          </p>
        )}
      </div>

      {/* Status message */}
      {state?.message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            state.success
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
              : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900"
          }`}
        >
          {state.message}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href={`/students/${studentId}`}
          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4.5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending || !preview || sessionCount === 0}
          className="inline-flex items-center justify-center rounded-xl bg-brand-orange-500 px-4.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-orange-600 disabled:opacity-50 cursor-pointer transition-colors"
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving…
            </span>
          ) : (
            "Save plan changes"
          )}
        </button>
      </div>
    </form>
  );
}
