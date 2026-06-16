"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { formatINR } from "@/lib/utils/student";
import { computeDaysLeft } from "@/lib/plan/calculations";
import type { StudentStatus } from "@/lib/utils/student";
import type { PlanRow } from "./types";
import { getFreezeDaysCount } from "./types";
import { UnfreezeButton } from "./FreezePlanPopup";
import { MoreVertical, Trash2, Snowflake, AlertTriangle } from "lucide-react";
import { deleteFreezePeriodAction } from "@/lib/actions/plans";

// ─── Grace WhatsApp Block ─────────────────────────────────────────────────────

function GraceWhatsAppBlock({
  student,
  plan,
  graceDeadline,
}: {
  student: { name: string; parentName: string; contactNumber: string };
  plan: PlanRow;
  graceDeadline: Date;
}) {
  const [copied, setCopied] = useState(false);
  const msgRef = useRef<HTMLTextAreaElement>(null);
  const [waMessage, setWaMessage] = useState(
    `Hi ${student.parentName}, 🙏\n\n${student.name}'s gymnastics plan (${
      plan.planType === "ONE_TO_ONE" ? "Personal training" : "Group class"
    }) has ended.\n\nYou have a ${plan.graceDays}-day grace period until ${graceDeadline.toLocaleDateString(
      "en-IN",
      { day: "numeric", month: "long", year: "numeric" },
    )}. Please renew the plan soon to avoid any break in sessions.\n\nThank you! 🤸`,
  );

  function copyMessage() {
    navigator.clipboard.writeText(waMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function openWhatsApp() {
    const encoded = encodeURIComponent(waMessage);
    const phone = student.contactNumber.replace(/\D/g, "");
    window.open(`https://wa.me/91${phone}?text=${encoded}`, "_blank");
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
        Auto-generated message
      </p>
      <textarea
        ref={msgRef}
        value={waMessage}
        onChange={(event) => setWaMessage(event.target.value)}
        rows={5}
        className="w-full text-xs rounded-xl border border-amber-200 dark:border-amber-800/60 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 px-3 py-2 resize-none focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={copyMessage}
          className="flex-1 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-955 transition-colors cursor-pointer"
        >
          {copied ? "✓ Copied!" : "Copy message"}
        </button>
        <button
          type="button"
          onClick={openWhatsApp}
          className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
        >
          Open WhatsApp
        </button>
      </div>
    </div>
  );
}

// ─── Remove Freeze Period Confirmation Popup ──────────────────────────────────

function RemoveConfirmPopup({
  freezePeriodId,
  studentId,
  durationDays,
  onClose,
}: {
  freezePeriodId: string;
  studentId: string;
  durationDays: number;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(
    deleteFreezePeriodAction,
    null,
  );

  useEffect(() => {
    if (state?.success) onClose();
  }, [state?.success, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4 text-center">
        <div className="flex justify-center text-red-505 text-3xl">⚠️</div>
        <div className="space-y-2">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Remove Freeze Period
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Are you sure you want to remove this freeze period? Removing this
            will{" "}
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
              reduce
            </strong>{" "}
            the active plan's end date and expiry deadline by{" "}
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
              {durationDays} days
            </strong>
            .
          </p>
        </div>

        {state?.message && !state.success && (
          <p className="text-xs text-rose-655 dark:text-rose-400">
            {state.message}
          </p>
        )}

        <form action={action} className="flex gap-2.5 pt-2">
          <input type="hidden" name="freezePeriodId" value={freezePeriodId} />
          <input type="hidden" name="studentId" value={studentId} />
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-xs font-semibold text-zinc-650 dark:text-zinc-305 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-xl bg-red-650 hover:bg-red-700 px-3 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            {pending ? "Removing…" : "Confirm Remove"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Freeze Period Item ───────────────────────────────────────────────────────

function FreezePeriodItem({
  id,
  startDate,
  endDate,
  canManage,
  studentId,
  planId,
}: {
  id?: string;
  startDate: Date | string;
  endDate: Date | string;
  canManage: boolean;
  studentId: string;
  planId: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const days = getFreezeDaysCount(startDate, endDate);

  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className="relative flex items-center justify-between gap-3 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 px-3.5 py-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-1.5 h-8 rounded-full bg-sky-300 dark:bg-sky-700 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 tabular-nums">
            {new Date(startDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            <span className="text-zinc-400 dark:text-zinc-505 font-normal mx-1.5">
              →
            </span>
            {new Date(endDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium mt-0.5">
            {days} day{days !== 1 ? "s" : ""} frozen
          </p>
        </div>
      </div>

      {canManage && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <menu className="absolute right-0 mt-1 w-36 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg py-1 z-20 animate-menu-show">
              {id ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowConfirm(true);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-955 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              ) : (
                <UnfreezeButton
                  planId={planId}
                  studentId={studentId}
                  variant="dropdown"
                />
              )}
            </menu>
          )}
        </div>
      )}

      {showConfirm && id && (
        <RemoveConfirmPopup
          freezePeriodId={id}
          studentId={studentId}
          durationDays={days}
          onClose={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

export function PlanCard({
  plan,
  sessionsPending,
  status,
  student,
  canManage,
  setShowFreeze,
}: {
  plan: PlanRow | null;
  sessionsPending: number | null;
  status: StudentStatus;
  student: {
    id: string;
    name: string;
    parentName: string;
    contactNumber: string;
  };
  canManage: boolean;
  setShowFreeze: (v: boolean) => void;
}) {
  if (!plan) return null;

  const daysLeft = computeDaysLeft(new Date(plan.expiryDate));
  const progress = Math.min(
    100,
    Math.round((plan.sessionsCompleted / plan.totalSessions) * 100),
  );
  const sessionsLeft = sessionsPending ?? 0;
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 7;

  const DAYS_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
  const FULL_DAY_MAP: Record<string, string> = {
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
    Sun: "Sunday",
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6 transition-colors">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Current plan
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {plan.discountPercent > 0 && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg">
              {plan.discountPercent}% off
            </span>
          )}

          {canManage && status !== "INACTIVE" && status !== "NO_PLAN" && (
            <button
              type="button"
              onClick={() => setShowFreeze(true)}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors cursor-pointer"
            >
              <Snowflake className="w-3.5 h-3.5" />
              Freeze Plan
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 min-[1200px]:grid-cols-2 gap-6">
        {/* CARD 1: Class & Batch Info Card */}
        <div className="space-y-2 min-w-0 flex flex-col h-full">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-555 block">
            Batch Details
          </span>
          <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-950/60 p-6 text-sm flex flex-col gap-8 flex-1 min-h-[240px]">
            <div className="grid grid-cols-2 gap-x-4 gap-y-8">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                  Class Type
                </span>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {plan.planType === "ONE_TO_ONE" ? "Personal" : "Grouped"}
                </p>
              </div>

              {plan.batch && (
                <>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                      Batch
                    </span>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {plan.batch.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                      Timing
                    </span>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {plan.batch.timing}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                      Active Students
                    </span>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {plan.batch.activeCount ?? 0} active
                    </p>
                  </div>
                </>
              )}
            </div>

            {Array.isArray(plan.selectedDays) &&
              (plan.selectedDays as string[]).length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                    Schedule
                  </span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {DAYS_ORDER.filter((short) =>
                      (plan.selectedDays as string[]).includes(
                        FULL_DAY_MAP[short],
                      ),
                    ).map((short) => (
                      <span
                        key={short}
                        className="text-xs font-bold rounded-lg px-2.5 py-1 bg-brand-orange-50 dark:bg-brand-orange-950/25 text-brand-orange-600 dark:text-brand-orange-400"
                      >
                        {short}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* CARD 2: Duration, Validity & Session Progress Card */}
        <div className="space-y-2 min-w-0 flex flex-col h-full">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-555 block">
            Plan Duration & Progress
          </span>
          <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-950/60 p-6 text-sm flex flex-col gap-8 flex-1 min-h-[240px]">
            <div className="grid grid-cols-2 gap-x-4 gap-y-8">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                  Start Date
                </span>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {new Date(plan.startDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                  End Date
                </span>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {new Date(plan.endDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                  {plan.graceDays > 0
                    ? `Grace Period (${plan.graceDays} d)`
                    : "Expiry Date"}
                </span>
                <p className="text-xs font-bold text-zinc-805 dark:text-zinc-200 mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span>
                    {new Date(plan.expiryDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      isExpiringSoon
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                        : "bg-zinc-200 text-zinc-700 dark:bg-zinc-805 dark:text-zinc-300"
                    }`}
                  >
                    {daysLeft > 0 ? `${daysLeft}d left` : "Expired"}
                  </span>
                </p>
              </div>
            </div>

            {/* Session progress */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                Sessions Completion
              </span>
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-900 dark:text-zinc-200 max-w-xs">
                <span>
                  {plan.sessionsCompleted} / {plan.totalSessions} completed
                </span>
                <span className="font-bold text-brand-orange-500">
                  {sessionsLeft} left
                </span>
              </div>
              {/* Progress bar: 3x height (h-6) and not full width (max-w-xs) */}
              <div className="relative h-6 w-full max-w-xs rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden mt-1.5">
                <div
                  className="h-full rounded-full bg-brand-orange-500 transition-all duration-550 flex items-center justify-center text-[10px] font-bold text-white px-2"
                  style={{ width: `${progress}%` }}
                >
                  {progress > 15 && `${progress}%`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Pricing Info Card */}
        <div className="space-y-2 min-[1200px]:col-span-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-555 block">
            Pricing Details
          </span>
          <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-950/60 p-6">
            <div className="grid grid-cols-3 gap-8">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                  Total Fee
                </span>
                <p className="text-xl font-bold text-zinc-955 dark:text-zinc-50 mt-0.5">
                  {formatINR(plan.fee)}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                  Per Session
                </span>
                <p className="text-xl font-bold text-zinc-955 dark:text-zinc-50 mt-0.5">
                  {plan.totalSessions > 0
                    ? formatINR(Math.round(plan.fee / plan.totalSessions))
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                  Discount Applied
                </span>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {plan.discountPercent > 0
                    ? `${plan.discountPercent}% off`
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Freeze periods list */}
      {((plan.freezePeriods && plan.freezePeriods.length > 0) ||
        (plan.freezeStartDate && plan.freezeEndDate)) && (
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-505">
            Frozen Periods
          </span>
          <div className="space-y-2">
            {(!plan.freezePeriods || plan.freezePeriods.length === 0) &&
              plan.freezeStartDate &&
              plan.freezeEndDate && (
                <FreezePeriodItem
                  key="legacy"
                  startDate={plan.freezeStartDate}
                  endDate={plan.freezeEndDate}
                  canManage={canManage}
                  studentId={student.id}
                  planId={plan.id}
                />
              )}
            {plan.freezePeriods &&
              plan.freezePeriods.map((fp) => (
                <FreezePeriodItem
                  key={fp.id}
                  id={fp.id}
                  startDate={fp.startDate}
                  endDate={fp.endDate}
                  canManage={canManage}
                  studentId={student.id}
                  planId={plan.id}
                />
              ))}
          </div>
        </div>
      )}

      {/* Grace Period Banner */}
      {status === "GRACE" && plan.graceDays > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-955/30 p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-550 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-855 dark:text-amber-300">
                Plan ended — Grace period active
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                {plan.graceDays}-day grace period until{" "}
                <strong>
                  {new Date(plan.expiryDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </strong>
              </p>
            </div>
          </div>
          <GraceWhatsAppBlock
            student={student}
            plan={plan}
            graceDeadline={new Date(plan.expiryDate)}
          />
        </div>
      )}
    </div>
  );
}
