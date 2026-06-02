"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AssignPlanForm from "./AssignPlanForm";
import StudentStatusBadge from "./StudentStatusBadge";
import StudentAvatar from "./StudentAvatar";
import {
  formatAge,
  formatINR,
  formatTenure,
  toDateInputValue,
  type StudentStatus,
} from "@/lib/utils/student";
import { computeDaysLeft } from "@/lib/plan/calculations";
import type { PricingMaps } from "@/lib/plan/pricing-defaults";

type PlanRow = {
  id: string;
  planType: string;
  startDate: Date;
  endDate: Date;
  totalSessions: number;
  sessionsCompleted: number;
  fee: number;
  expiryDate: Date;
  isActive: boolean;
  selectedDays: unknown;
  discountPercent: number;
};

export default function StudentDetailClient({
  student,
  canManage,
  showAssignInitially,
  pricingMaps,
}: {
  student: {
    id: string;
    studentNumber: number;
    name: string;
    dateOfBirth: Date;
    parentName: string;
    contactNumber: string;
    admissionDate: Date;
    notes: string | null;
    avatarUrl?: string | null;
    status: StudentStatus;
    activePlan: PlanRow | null;
    sessionsPending: number | null;
    plans: PlanRow[];
  };
  canManage: boolean;
  showAssignInitially?: boolean;
  pricingMaps: PricingMaps;
}) {
  const router = useRouter();
  const [showAssign, setShowAssign] = useState(
    showAssignInitially || !student.activePlan
  );

  function onPlanAssigned() {
    setShowAssign(false);
    router.refresh();
  }

  const plan = student.activePlan;

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <StudentAvatar student={student} size={80} />
          <div className="min-w-0">
            <Link
              href="/students"
              className="text-sm text-zinc-500 hover:text-zinc-800"
            >
              ← Students
            </Link>
            <h1 className="mt-2 text-xl sm:text-2xl font-semibold text-zinc-900 truncate">
              {student.name}
            </h1>
            <p className="text-sm text-zinc-500">
              ID #{student.studentNumber} · {formatAge(new Date(student.dateOfBirth))} ·{" "}
              Tenure {formatTenure(new Date(student.admissionDate))}
            </p>
          </div>
        </div>
        <StudentStatusBadge status={student.status} />
      </div>

      <div className="grid gap-3.5 lg:grid-cols-2">
        <div className="rounded-lg border-0 bg-white dark:bg-zinc-900 p-4 sm:p-6 shadow-sm">
          <h2 className="text-sm font-medium text-zinc-900">Contact</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Parent</dt>
              <dd className="font-medium text-zinc-900 text-right">
                {student.parentName}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Phone</dt>
              <dd className="font-medium text-zinc-900">
                <a href={`tel:${student.contactNumber}`} className="hover:underline">
                  {student.contactNumber}
                </a>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">DOB</dt>
              <dd className="font-medium text-zinc-900">
                {new Date(student.dateOfBirth).toLocaleDateString("en-IN")}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Admitted</dt>
              <dd className="font-medium text-zinc-900">
                {new Date(student.admissionDate).toLocaleDateString("en-IN")}
              </dd>
            </div>
          </dl>
          {student.notes && (
            <p className="mt-4 text-sm text-zinc-600 border-t border-zinc-100 pt-3">
              {student.notes}
            </p>
          )}
        </div>

        <div className="rounded-lg border-0 bg-white dark:bg-zinc-900 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-zinc-900">Current plan</h2>
            {canManage && plan && (
              <button
                type="button"
                onClick={() => setShowAssign(!showAssign)}
                className="text-xs font-medium text-brand-orange-600 hover:underline cursor-pointer"
              >
                {showAssign ? "Cancel" : "Change plan"}
              </button>
            )}
          </div>

          {plan ? (
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Type</dt>
                <dd className="font-medium">
                  {plan.planType === "ONE_TO_ONE" ? "1-to-1" : "Regular"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Period</dt>
                <dd className="font-medium text-right text-xs sm:text-sm">
                  {new Date(plan.startDate).toLocaleDateString("en-IN")} –{" "}
                  {new Date(plan.endDate).toLocaleDateString("en-IN")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Sessions</dt>
                <dd className="font-medium">
                  {plan.sessionsCompleted} / {plan.totalSessions} done ·{" "}
                  {student.sessionsPending} left
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Fee</dt>
                <dd className="font-medium">{formatINR(plan.fee)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Expiry</dt>
                <dd className="font-medium">
                  {new Date(plan.expiryDate).toLocaleDateString("en-IN")} (
                  {computeDaysLeft(new Date(plan.expiryDate))} days left)
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">No plan assigned yet.</p>
          )}

          {canManage && !plan && !showAssign && (
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={`/plans?student=${student.id}`}
                className="w-full rounded-lg bg-brand-orange-500 py-2.5 text-sm font-semibold text-white text-center hover:bg-brand-orange-600"
              >
                Create & assign plan
              </Link>
              <button
                type="button"
                onClick={() => setShowAssign(true)}
                className="text-xs text-zinc-500 hover:text-zinc-700 cursor-pointer"
              >
                Or fill in the form on this page
              </button>
            </div>
          )}
        </div>
      </div>

      {canManage && showAssign && (
        <div className="rounded-lg border-0 bg-white dark:bg-zinc-900 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-medium text-zinc-900">
                {plan ? "Assign new plan" : "Assign plan"}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                A new plan replaces the current active plan.
              </p>
            </div>
            <Link
              href={`/plans?student=${student.id}`}
              className="text-xs font-medium text-brand-orange-600 hover:underline shrink-0"
            >
              Open full Plans page →
            </Link>
          </div>
          <AssignPlanForm
            studentId={student.id}
            pricingMaps={pricingMaps}
            onSuccess={onPlanAssigned}
          />
        </div>
      )}

      {student.plans.length > 0 && (
        <div className="rounded-lg border-0 bg-white dark:bg-zinc-900 shadow-sm overflow-x-auto">
          <h2 className="text-sm font-medium text-zinc-900 p-4 border-b border-zinc-100">
            Plan history
          </h2>
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-xs text-zinc-500 bg-zinc-50/80">
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Dates</th>
                <th className="px-4 py-2 text-left">Sessions</th>
                <th className="px-4 py-2 text-left">Fee</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {student.plans.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2">
                    {p.planType === "ONE_TO_ONE" ? "1-to-1" : "Regular"}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {toDateInputValue(new Date(p.startDate))} →{" "}
                    {toDateInputValue(new Date(p.endDate))}
                  </td>
                  <td className="px-4 py-2">
                    {p.sessionsCompleted}/{p.totalSessions}
                  </td>
                  <td className="px-4 py-2">{formatINR(p.fee)}</td>
                  <td className="px-4 py-2">
                    {p.isActive ? (
                      <span className="text-emerald-600 text-xs font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-xs">Archived</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
