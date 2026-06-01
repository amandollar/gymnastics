"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { assignPlanAction } from "@/lib/actions/students";
import {
  computePlanFields,
  type PlanTypeKey,
  type WeekdayName,
} from "@/lib/plan/calculations";
import type { PricingMaps } from "@/lib/plan/pricing-defaults";
import { parseDateInput, toDateInputValue } from "@/lib/utils/student";
import PlanBuilderFields from "@/components/plans/PlanBuilderFields";

export default function AssignPlanForm({
  studentId,
  pricingMaps,
  onSuccess,
}: {
  studentId: string;
  pricingMaps: PricingMaps;
  onSuccess?: () => void;
}) {
  const today = toDateInputValue(new Date());
  const [planType, setPlanType] = useState<PlanTypeKey>("REGULAR");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState("");
  const [selectedDays, setSelectedDays] = useState<WeekdayName[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);

  const boundAction = assignPlanAction.bind(null, studentId);
  const [state, action, pending] = useActionState(boundAction, null);

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

  if (state?.success) {
    onSuccess?.();
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 space-y-2">
        <p>{state.message}</p>
        <Link
          href="/plans"
          className="inline-block font-medium text-emerald-900 hover:underline"
        >
          Open full Plans page →
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
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

      {state?.message && !state.success && (
        <p className="text-sm text-rose-600">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending || !preview || preview.totalSessions === 0}
        className="w-full sm:w-auto rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
      >
        {pending ? "Saving plan…" : "Save plan"}
      </button>
    </form>
  );
}
