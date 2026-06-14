"use client";

import { useState, useRef, useEffect, useMemo, useActionState } from "react";
import { useRouter } from "next/navigation";
import AssignPlanForm from "./AssignPlanForm";
import StudentStatusBadge from "./StudentStatusBadge";
import StudentAvatar from "./StudentAvatar";
import {
  formatAge,
  formatINR,
  formatJoinedDate,
  formatTenure,
  toDateInputValue,
  type StudentStatus,
} from "@/lib/utils/student";
import { computeDaysLeft } from "@/lib/plan/calculations";
import type { PricingMaps } from "@/lib/plan/pricing-defaults";
import { freezePlanAction, unfreezePlanAction } from "@/lib/actions/plans";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanRow = {
  id: string;
  planType: string;
  startDate: Date;
  endDate: Date;
  totalSessions: number;
  sessionsCompleted: number;
  fee: number;
  expiryDate: Date;
  /** Grace days stored at plan creation. */
  graceDays: number;
  isActive: boolean;
  selectedDays: unknown;
  discountPercent: number;
  freezeStartDate: Date | null;
  freezeEndDate: Date | null;
  batch?: { id: string; name: string; timing: string } | null;
};

type AttendanceRow = {
  id: string;
  date: Date;
  studentPlanId: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSessionDate(date: Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Returns YYYY-MM-DD string for a date (no timezone shift) */
function toYMD(date: Date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─── Calendar Popup ───────────────────────────────────────────────────────────

function CalendarPopup({
  attendanceMap,
  onClose,
}: {
  attendanceMap: Map<string, number>; // "YYYY-MM-DD" → sessionNumber
  onClose: () => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    "en-IN",
    { month: "long", year: "numeric" }
  );

  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
          >
            ›
          </button>
          <button
            onClick={onClose}
            className="ml-2 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase px-4 pt-3 pb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px px-4 pb-5">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const sessionNum = attendanceMap.get(key);
            const isPresent = sessionNum !== undefined;
            return (
              <div
                key={key}
                className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-xs transition-colors ${
                  isPresent
                    ? "bg-brand-orange-500 text-white font-bold"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                <span className={isPresent ? "text-[9px] font-bold opacity-80" : "hidden"}>
                  S{sessionNum}
                </span>
                <span>{day}</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 px-5 pb-4 text-xs text-zinc-400 dark:text-zinc-500">
          <span className="inline-block w-3 h-3 rounded bg-brand-orange-500" />
          Session attended
        </div>
      </div>
    </div>
  );
}

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
    `Hi ${student.parentName}, 🙏\n\n${student.name}'s gymnastics plan (${plan.planType === "ONE_TO_ONE" ? "Personal training" : "Group class"}) has ended.\n\nYou have a ${plan.graceDays}-day grace period until ${graceDeadline.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}. Please renew the plan soon to avoid any break in sessions.\n\nThank you! 🤸`
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
          className="flex-1 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
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

// ─── Unfreeze Button ───────────────────────────────────────────────────────────

function UnfreezeButton({ planId, studentId }: { planId: string; studentId: string }) {
  const [state, action, pending] = useActionState(unfreezePlanAction, null);
  return (
    <form action={action}>
      <input type="hidden" name="studentPlanId" value={planId} />
      <input type="hidden" name="studentId" value={studentId} />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-xl border border-sky-300 dark:border-sky-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors cursor-pointer disabled:opacity-50"
      >
        {pending ? "Removing…" : "Unfreeze"}
      </button>
      {state?.message && !state.success && (
        <p className="text-xs text-rose-600 mt-1">{state.message}</p>
      )}
    </form>
  );
}

// ─── Freeze Plan Form ──────────────────────────────────────────────────────────

function FreezePlanForm({
  planId,
  studentId,
  open,
  setOpen,
}: {
  planId: string;
  studentId: string;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const today = toDateInputValue(new Date());
  const [state, action, pending] = useActionState(freezePlanAction, null);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state?.success, setOpen]);

  return (
    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
        >
          ❄️ Freeze plan (holiday break)
        </button>
      ) : (
        <form action={action} className="space-y-3">
          <input type="hidden" name="studentPlanId" value={planId} />
          <input type="hidden" name="studentId" value={studentId} />
          <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Freeze dates (holiday break)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider">Start</label>
              <input
                name="freezeStartDate"
                type="date"
                required
                defaultValue={today}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider">End</label>
              <input
                name="freezeEndDate"
                type="date"
                required
                defaultValue={today}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
            The plan end date and grace deadline will be extended by the freeze duration.
          </p>
          {state?.message && !state.success && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{state.message}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-xl bg-sky-600 hover:bg-sky-700 px-3 py-2 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {pending ? "Freezing…" : "Apply freeze"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Plan Package Card ────────────────────────────────────────────────────────

function PlanCard({
  plan,
  sessionsPending,
  status,
  student,
  canManage,
  showAssign,
  setShowAssign,
  showFreeze,
  setShowFreeze,
  assignSectionRef,
  freezeSectionRef,
  pricingMaps,
  onPlanAssigned,
}: {
  plan: PlanRow | null;
  sessionsPending: number | null;
  status: StudentStatus;
  student: { id: string; name: string; parentName: string; contactNumber: string };
  canManage: boolean;
  showAssign: boolean;
  setShowAssign: (v: boolean) => void;
  showFreeze: boolean;
  setShowFreeze: (v: boolean) => void;
  assignSectionRef: React.RefObject<HTMLDivElement | null>;
  freezeSectionRef: React.RefObject<HTMLDivElement | null>;
  pricingMaps: PricingMaps;
  onPlanAssigned: () => void;
}) {
  // daysLeft relative to grace deadline (expiryDate)
  const daysLeft = plan ? computeDaysLeft(new Date(plan.expiryDate)) : 0;

  // Progress bar
  const progress = plan
    ? Math.min(100, Math.round((plan.sessionsCompleted / plan.totalSessions) * 100))
    : 0;

  return (
    <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Plan Package
        </h2>
        {canManage && plan && (
          <button
            type="button"
            onClick={() => setShowAssign(!showAssign)}
            className="text-xs font-medium text-brand-orange-500 hover:underline cursor-pointer"
          >
            {showAssign ? "Cancel" : "Change plan"}
          </button>
        )}
      </div>

      {plan ? (
        <>
          {/* Plan type pill */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
              {plan.planType === "ONE_TO_ONE" ? "Personal training" : "Group class"}
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {new Date(plan.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              {" – "}
              {new Date(plan.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>

          {/* Sessions progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>{plan.sessionsCompleted} sessions done</span>
              <span>{sessionsPending ?? 0} left of {plan.totalSessions}</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-orange-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Key details */}
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2.5">
              <dt className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-0.5">Fee</dt>
              <dd className="font-semibold text-zinc-900 dark:text-zinc-100">{formatINR(plan.fee)}</dd>
            </div>
            <div className={`rounded-2xl px-3 py-2.5 ${daysLeft <= 7 ? "bg-amber-50 dark:bg-amber-950/40" : "bg-zinc-50 dark:bg-zinc-800/60"}`}>
              <dt className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-0.5">
                {plan.graceDays > 0 ? "Grace deadline" : "Expires"}
              </dt>
              <dd className={`font-semibold text-sm ${daysLeft <= 7 ? "text-amber-700 dark:text-amber-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                {new Date(plan.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {daysLeft > 0 && <span className="text-xs font-normal ml-1 opacity-70">({daysLeft}d left)</span>}
              </dd>
            </div>
          </dl>

          {/* Grace period banner */}
          {status === "GRACE" && plan.graceDays > 0 && (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-amber-500 text-lg leading-none">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Plan ended — Grace period active
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    {plan.graceDays}-day grace period until{" "}
                    <strong>
                      {new Date(plan.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
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

        </>
      ) : (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">No plan assigned yet.</p>
      )}

      {canManage && !plan && !showAssign && (
        <button
          type="button"
          onClick={() => setShowAssign(true)}
          className="w-full rounded-xl bg-brand-orange-500 py-2.5 text-sm font-semibold text-white text-center hover:bg-brand-orange-600 transition-colors"
        >
          Assign plan
        </button>
      )}

      {canManage && showAssign && (
        <div ref={assignSectionRef} className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <AssignPlanForm
            studentId={student.id}
            pricingMaps={pricingMaps}
            onSuccess={onPlanAssigned}
          />
        </div>
      )}

      {/* Freeze plan form — shown when plan is active/grace and not already frozen */}
      {canManage && plan && status !== "FREEZE" && status !== "INACTIVE" && status !== "NO_PLAN" && (
        <div ref={freezeSectionRef}>
          <FreezePlanForm
            planId={plan.id}
            studentId={student.id}
            open={showFreeze}
            setOpen={setShowFreeze}
          />
        </div>
      )}

      {/* Freeze status banner */}
      {status === "FREEZE" && plan && plan.freezeStartDate && plan.freezeEndDate && (
        <div className="rounded-2xl border border-sky-200 dark:border-sky-800/60 bg-sky-50 dark:bg-sky-950/30 px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="text-sky-500 text-lg leading-none">❄️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-sky-800 dark:text-sky-300">
                Plan frozen — Holiday break
              </p>
              <p className="text-xs text-sky-700 dark:text-sky-400 mt-0.5">
                Frozen from{" "}
                <strong>{new Date(plan.freezeStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</strong>
                {" to "}
                <strong>{new Date(plan.freezeEndDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>.
                End date extended accordingly.
              </p>
            </div>
            {canManage && (
              <UnfreezeButton planId={plan.id} studentId={student.id} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Attendance Card ──────────────────────────────────────────────────────────

// ─── Attendance Card ──────────────────────────────────────────────────────────

function AttendanceCard({
  attendances,
  activePlan,
}: {
  attendances: AttendanceRow[];
  activePlan: PlanRow | null;
}) {
  const [showLogs, setShowLogs] = useState(false);
  
  const dates = attendances.map((a) => new Date(a.date).getTime());
  const earliestAttendance = dates.length > 0 ? new Date(Math.min(...dates)) : null;
  const latestAttendance = dates.length > 0 ? new Date(Math.max(...dates)) : null;

  const planStart = activePlan ? new Date(activePlan.startDate) : null;
  const planEnd = activePlan ? new Date(activePlan.endDate) : null;

  // start date is min(plan.startDate, earliestAttendance)
  const calendarStart = useMemo(() => {
    let start = new Date();
    if (planStart && earliestAttendance) {
      start = planStart < earliestAttendance ? planStart : earliestAttendance;
    } else if (planStart) {
      start = planStart;
    } else if (earliestAttendance) {
      start = earliestAttendance;
    }
    return start;
  }, [planStart, earliestAttendance]);

  // end date is max(plan.endDate, latestAttendance)
  const calendarEnd = useMemo(() => {
    let end = new Date();
    if (planEnd && latestAttendance) {
      end = planEnd > latestAttendance ? planEnd : latestAttendance;
    } else if (planEnd) {
      end = planEnd;
    } else if (latestAttendance) {
      end = latestAttendance;
    }
    return end;
  }, [planEnd, latestAttendance]);

  // Get list of months to render
  const months = useMemo(() => {
    const list: { year: number; month: number }[] = [];
    const curr = new Date(calendarStart.getFullYear(), calendarStart.getMonth(), 1);
    const last = new Date(calendarEnd.getFullYear(), calendarEnd.getMonth(), 1);

    let safetyCounter = 0;
    while (curr <= last && safetyCounter < 24) {
      list.push({ year: curr.getFullYear(), month: curr.getMonth() });
      curr.setMonth(curr.getMonth() + 1);
      safetyCounter++;
    }
    if (list.length === 0) {
      const today = new Date();
      list.push({ year: today.getFullYear(), month: today.getMonth() });
    }
    return list;
  }, [calendarStart, calendarEnd]);

  // Build a map: "YYYY-MM-DD" → sessionNumber
  const attendanceMap = useMemo(() => {
    const map = new Map<string, number>();
    attendances.forEach((a, idx) => {
      map.set(toYMD(a.date), idx + 1);
    });
    return map;
  }, [attendances]);

  // Check if a specific date is within range
  const isDateInPlanRange = (year: number, month: number, day: number) => {
    if (!planStart && !earliestAttendance) return false;
    const current = new Date(year, month, day).getTime();
    const start = new Date(calendarStart.getFullYear(), calendarStart.getMonth(), calendarStart.getDate()).getTime();
    const end = new Date(calendarEnd.getFullYear(), calendarEnd.getMonth(), calendarEnd.getDate()).getTime();
    return current >= start && current <= end;
  };

  const todayYMD = toYMD(new Date());

  return (
    <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Attendance & Schedule
        </h2>
        <div className="flex items-center gap-3.5">
          {activePlan && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500 hidden sm:inline">
              Plan period: {new Date(activePlan.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} to {new Date(activePlan.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
          {attendances.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLogs(!showLogs)}
              className="text-xs font-semibold text-brand-orange-500 hover:text-brand-orange-600 transition-colors cursor-pointer"
            >
              {showLogs ? "Hide logs" : "Show logs"}
            </button>
          )}
        </div>
      </div>

      <div className={showLogs ? "grid gap-6 md:grid-cols-[1fr_260px]" : "w-full"}>
        {/* Scrollable multi-month grid */}
        <div className="flex flex-col min-w-0 justify-between">
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin snap-x">
            {months.map(({ year, month }) => {
              const monthName = new Date(year, month, 1).toLocaleDateString(
                "en-IN",
                { month: "long", year: "numeric" }
              );
              const firstDay = new Date(year, month, 1).getDay();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const cells = [
                ...Array(firstDay).fill(null),
                ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
              ];

              return (
                <div key={`${year}-${month}`} className="w-[260px] shrink-0 snap-start">
                  <div className="text-center pb-2 border-b border-zinc-100 dark:border-zinc-850 mb-2">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {monthName}
                    </span>
                  </div>

                  {/* Day labels */}
                  <div className="grid grid-cols-7 text-center text-[9px] font-bold text-zinc-400 dark:text-zinc-550 uppercase pb-1">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((day, idx) => {
                      if (!day) return <div key={`empty-${idx}`} />;
                      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const sessionNum = attendanceMap.get(dateKey);
                      const isPresent = sessionNum !== undefined;
                      const inPlanRange = isDateInPlanRange(year, month, day);
                      const isToday = dateKey === todayYMD;

                      let cellStyle = "text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/40";
                      if (isPresent) {
                        cellStyle = "bg-brand-orange-500 text-white font-bold shadow-xs";
                      } else if (inPlanRange) {
                        cellStyle = "bg-brand-orange-50/60 dark:bg-brand-orange-950/20 text-brand-orange-700 dark:text-brand-orange-400 font-semibold border border-brand-orange-500/10";
                      }

                      return (
                        <div
                          key={dateKey}
                          className={`flex flex-col items-center justify-center h-8 rounded-lg text-[10px] transition-colors relative cursor-default ${cellStyle} ${
                            isToday ? "ring-2 ring-zinc-950 dark:ring-zinc-100 ring-offset-1 dark:ring-offset-zinc-900" : ""
                          }`}
                        >
                          {isPresent ? (
                            <div className="flex flex-col items-center justify-center leading-none">
                              <span className="text-[11px] font-bold">S{sessionNum}</span>
                              <span className="text-[7px] opacity-80 font-normal mt-0.5">{day}</span>
                            </div>
                          ) : (
                            <span className="leading-none">{day}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-zinc-100 dark:border-zinc-800 mt-2 pt-3 text-[10px] text-zinc-400 dark:text-zinc-550">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded bg-brand-orange-500" />
              <span>Attended</span>
            </div>
            {(activePlan || earliestAttendance) && (
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded bg-brand-orange-50 dark:bg-brand-orange-950/30 border border-brand-orange-500/20" />
                <span>Plan duration</span>
              </div>
            )}
          </div>
        </div>

        {/* Sessions list */}
        {showLogs && (
          <div className="flex flex-col min-w-0 md:border-l md:border-zinc-100 md:dark:border-zinc-800 md:pl-6">
            <div className="space-y-1 overflow-y-auto max-h-[300px] pr-1">
              {attendances.length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 py-10 text-center">
                  No sessions attended yet.
                </p>
              ) : (
                attendances
                  .slice()
                  .reverse()
                  .map((a, idx) => {
                    const sessionIndex = attendances.length - idx;
                    return (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-orange-50 dark:bg-brand-orange-950/40 text-brand-orange-600 dark:text-brand-orange-400 text-[11px] font-bold shrink-0">
                          {sessionIndex}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                            Session {sessionIndex}
                          </p>
                          <p className="text-sm font-semibold text-zinc-855 dark:text-zinc-200 truncate">
                            {formatSessionDate(a.date)}
                          </p>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
    gender: string;
    parentName: string;
    contactNumber: string;
    admissionDate: Date;
    notes: string | null;
    medicalHistory: string | null;
    avatarUrl?: string | null;
    status: StudentStatus;
    activePlan: PlanRow | null;
    sessionsPending: number | null;
    plans: PlanRow[];
    attendances: AttendanceRow[];
  };
  canManage: boolean;
  showAssignInitially?: boolean;
  pricingMaps: PricingMaps;
}) {
  const router = useRouter();
  const [showAssign, setShowAssign] = useState(
    showAssignInitially || !student.activePlan
  );
  const [showFreeze, setShowFreeze] = useState(false);

  const assignSectionRef = useRef<HTMLDivElement>(null);
  const freezeSectionRef = useRef<HTMLDivElement>(null);

  const [unfreezeState, unfreezeAction, unfreezePending] = useActionState(
    unfreezePlanAction,
    null
  );

  function onPlanAssigned() {
    setShowAssign(false);
    router.refresh();
  }

  return (
    <div className="space-y-6 min-w-0">
      {/* Page title + action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-zinc-900 dark:text-zinc-50">
            Student Profile
          </h1>
          <StudentStatusBadge status={student.status} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/students/${student.id}/id-card`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7" />
              <rect x="3" y="9" width="18" height="10" rx="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 14h12M6 18h8" />
              <circle cx="18" cy="13" r="1" fill="currentColor" />
            </svg>
            Print ID card
          </a>

          {/* Change plan */}
          {canManage && (
            <button
              type="button"
              onClick={() => {
                setShowAssign(true);
                setTimeout(() => {
                  assignSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 100);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Change plan
            </button>
          )}

          {/* Freeze plan */}
          {canManage && student.activePlan && student.status !== "FREEZE" && student.status !== "INACTIVE" && student.status !== "NO_PLAN" && (
            <button
              type="button"
              onClick={() => {
                setShowFreeze(true);
                setTimeout(() => {
                  freezeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 100);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18M12 9l-3-3M12 15l-3 3M12 9l3-3M12 15l3 3M9 12L6 9M15 12l3-3M9 12l-3 3M15 12l3 3" />
              </svg>
              Freeze plan
            </button>
          )}

          {/* Unfreeze plan */}
          {canManage && student.activePlan && student.status === "FREEZE" && (
            <form action={unfreezeAction}>
              <input type="hidden" name="studentPlanId" value={student.activePlan.id} />
              <input type="hidden" name="studentId" value={student.id} />
              <button
                type="submit"
                disabled={unfreezePending}
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 dark:border-sky-850 bg-sky-50 dark:bg-sky-950/20 px-3.5 py-2 text-sm font-semibold text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-950/40 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                ☀️ Unfreeze plan
              </button>
            </form>
          )}

          {/* Edit profile */}
          {canManage && (
            <a
              href={`/students/${student.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.94l-3.414 1.137 1.137-3.414A4 4 0 019 13z" />
              </svg>
              Edit profile
            </a>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-5 lg:grid-cols-[300px_1fr] min-w-0">

        {/* ── Left column ── */}
        <div className="space-y-4 min-w-0">

          {/* Avatar + name card */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col items-center text-center gap-3">
            <StudentAvatar student={student} size={96} />
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {student.name}
              </h2>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
                #{student.studentNumber}
              </p>
            </div>
          </div>

          {/* Basic info card */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Details
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">Age</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
                  {formatAge(new Date(student.dateOfBirth))}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">Gender</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right capitalize">
                  {student.gender}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">DOB</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
                  {new Date(student.dateOfBirth).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">Batch</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
                  {student.activePlan?.batch?.name ?? "no batch assigned"}
                </dd>
              </div>
              <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">Parent</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
                  {student.parentName}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">Phone</dt>
                <dd className="font-medium text-right">
                  <a
                    href={`tel:${student.contactNumber}`}
                    className="text-brand-orange-500 hover:underline"
                  >
                    {student.contactNumber}
                  </a>
                </dd>
              </div>
              <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">Joined</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
                  {formatJoinedDate(new Date(student.admissionDate))}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">Tenure</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
                  {formatTenure(new Date(student.admissionDate))}
                </dd>
              </div>
            </dl>

            {(student.notes || student.medicalHistory) && (
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                {student.notes && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    📝 {student.notes}
                  </p>
                )}
                {student.medicalHistory && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    🏥 {student.medicalHistory}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4 min-w-0">
          <AttendanceCard
            attendances={student.attendances}
            activePlan={student.activePlan}
          />

          <PlanCard
            plan={student.activePlan}
            sessionsPending={student.sessionsPending}
            status={student.status}
            student={student}
            canManage={canManage}
            showAssign={showAssign}
            setShowAssign={setShowAssign}
            showFreeze={showFreeze}
            setShowFreeze={setShowFreeze}
            assignSectionRef={assignSectionRef}
            freezeSectionRef={freezeSectionRef}
            pricingMaps={pricingMaps}
            onPlanAssigned={onPlanAssigned}
          />

          {/* Plan history */}
          {student.plans.length > 0 && (
            <div className="rounded-3xl bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
              <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider p-5 pb-3">
                Plan History
              </h2>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm min-w-[420px]">
                  <thead>
                    <tr className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider bg-zinc-50 dark:bg-zinc-800/60">
                      <th className="px-5 py-2.5 text-left">Type</th>
                      <th className="px-5 py-2.5 text-left">Period</th>
                      <th className="px-5 py-2.5 text-left">Sessions</th>
                      <th className="px-5 py-2.5 text-left">Fee</th>
                      <th className="px-5 py-2.5 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {student.plans.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-5 py-3 capitalize">
                          {p.planType === "ONE_TO_ONE" ? "personal" : "grouped"}
                        </td>
                        <td className="px-5 py-3 text-xs text-zinc-500">
                          {toDateInputValue(new Date(p.startDate))} → {toDateInputValue(new Date(p.endDate))}
                        </td>
                        <td className="px-5 py-3">
                          {p.sessionsCompleted}/{p.totalSessions}
                        </td>
                        <td className="px-5 py-3">{formatINR(p.fee)}</td>
                        <td className="px-5 py-3">
                          {p.isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
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

              {/* Mobile Card View */}
              <div className="block sm:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                {student.plans.map((p) => (
                  <div key={p.id} className="p-4 space-y-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-orange-50 dark:bg-brand-orange-950/40 text-brand-orange-700 dark:text-brand-orange-400 uppercase tracking-wider">
                        {p.planType === "ONE_TO_ONE" ? "personal" : "grouped"}
                      </span>
                      {p.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                          Active
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs font-medium">Archived</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="col-span-2">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">Period</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {toDateInputValue(new Date(p.startDate))} → {toDateInputValue(new Date(p.endDate))}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">Sessions</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {p.sessionsCompleted} / {p.totalSessions}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">Fee</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {formatINR(p.fee)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
