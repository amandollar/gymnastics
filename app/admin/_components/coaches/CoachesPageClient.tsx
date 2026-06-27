"use client";

import { useState, useTransition, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  Calendar,
  Phone,
  Clock,
  TrendingUp,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  User,
  Edit2,
  Briefcase,
  MoreVertical,
  Award,
  Users,
  Loader2,
  Check,
  Printer,
} from "lucide-react";
import {
  createCoachAction,
  updateCoachAction,
  markCoachAttendanceAction,
  deleteCoachAttendanceAction,
  getCoachEarningsAction,
  toggleCoachSalaryPaymentAction,
  toggleCoachStatusAction,
  getSalarySlipDataAction,
} from "@/lib/actions/coaches";
import type { CoachWithStats } from "@/lib/services/coaches";
import type { CoachAttendanceStatus, CoachRole } from "@prisma/client";
import StudentAvatarPicker from "@/app/admin/_components/students/StudentAvatarPicker";
import { getMonthSalaryMultiplier } from "@/lib/utils/salary";
import { SalarySlip } from "@/app/admin/_components/coaches/SalarySlip";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CoachEarningRow {
  studentPlanId: string;
  studentId: string;
  studentName: string;
  studentNumber: number;
  planStartDate: string;
  planEndDate: string;
  totalFee: number;
  coachShare: number;
  planMonths: number;
  monthlyAmount: number;
  commissionPercent: number;
  pricePerSession: number;
  months: { year: number; month: number; label: string; amount: number; daysAttended: number }[];
}

interface Props {
  coaches: CoachWithStats[];
  todayStr: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const toInputDate = (d: Date) => d.toISOString().split("T")[0];

const TIME_SLOTS = [
  "5:00 AM", "5:30 AM", "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM",
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
  "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM",
  "11:00 PM"
];

// ─── Coach Form Modal ──────────────────────────────────────────────────────────

function CoachFormModal({
  existing,
  initialRole = "COACH",
  onClose,
  onSaved,
}: {
  existing?: CoachWithStats | null;
  initialRole?: CoachRole;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!existing;
  const [role, setRole] = useState<CoachRole>(existing?.role ?? initialRole);
  const [bioText, setBioText] = useState(existing?.bio ?? "");

  const [startTime, setStartTime] = useState(() => {
    if (existing?.timing) {
      const parts = existing.timing.split(/ – | - /);
      return parts[0] || "7:00 AM";
    }
    return "7:00 AM";
  });
  const [endTime, setEndTime] = useState(() => {
    if (existing?.timing) {
      const parts = existing.timing.split(/ – | - /);
      return parts[1] || "9:00 AM";
    }
    return "9:00 AM";
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = isEdit
        ? await updateCoachAction(existing!.id, null, formData)
        : await createCoachAction(null, formData);
      if (result.success) {
        onSaved(result.message ?? (isEdit ? "Coach updated" : "Coach added"));
        onClose();
      } else {
        setError(result.message ?? "Something went wrong");
      }
    });
  }

  const inputCls =
    "w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-400/60 transition-all";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-orange-100 dark:bg-brand-orange-950/40 text-brand-orange-600 dark:text-brand-orange-400">
              <Dumbbell className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {isEdit ? "Edit Employee Details" : `Add ${role === "COACH" ? "Coach" : "Staff Employee"}`}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <input type="hidden" name="role" value={role} />
              <div className="px-6 py-5 space-y-4">
                {role === "COACH" && (
                  <div className="flex justify-center pb-2">
                    <StudentAvatarPicker
                      currentAvatarUrl={existing?.avatarUrl || "/icons/coach-profile-placeholder.webp"}
                    />
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <input name="name" required defaultValue={existing?.name} placeholder="Full name" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Contact Number *</label>
                    <input name="contactNumber" required defaultValue={existing?.contactNumber} placeholder="+91 98765 43210" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input name="email" type="email" defaultValue={existing?.email ?? ""} placeholder="employee@example.com" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Address *</label>
                  <input name="address" required defaultValue={existing?.address ?? ""} placeholder="Residential Address" className={inputCls} />
                </div>
                {role === "COACH" ? (
                  <>
                    <div>
                      <label className={labelCls}>Join Date *</label>
                      <input name="joinDate" type="date" required defaultValue={existing ? toInputDate(new Date(existing.joinDate)) : toInputDate(new Date())} className={inputCls} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}>Specialization</label>
                        <input name="specialization" defaultValue={existing?.specialization ?? ""} placeholder="e.g. Gymnastics" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Timing</label>
                        <input type="hidden" name="timing" value={`${startTime} – ${endTime}`} />
                        <div className="flex items-center gap-1.5 w-full">
                          <select
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className={`${inputCls} w-full cursor-pointer text-center font-medium`}
                          >
                            {TIME_SLOTS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          <span className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold shrink-0">to</span>
                          <select
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className={`${inputCls} w-full cursor-pointer text-center font-medium`}
                          >
                            {TIME_SLOTS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}>Join Date *</label>
                        <input name="joinDate" type="date" required defaultValue={existing ? toInputDate(new Date(existing.joinDate)) : toInputDate(new Date())} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Fixed Monthly Salary (₹)</label>
                        <input name="fixedSalary" type="number" min={0} defaultValue={existing?.fixedSalary ?? 0} className={inputCls} />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}>Timing</label>
                        <input type="hidden" name="timing" value={`${startTime} – ${endTime}`} />
                        <div className="flex items-center gap-1.5 w-full">
                          <select
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className={`${inputCls} w-full cursor-pointer text-center font-medium`}
                          >
                            {TIME_SLOTS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          <span className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold shrink-0">to</span>
                          <select
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className={`${inputCls} w-full cursor-pointer text-center font-medium`}
                          >
                            {TIME_SLOTS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {isEdit && (
                        <div>
                          <label className={labelCls}>Status</label>
                          <select name="status" defaultValue={existing?.status ?? "WORKING"} className={inputCls}>
                            <option value="WORKING">Working</option>
                            <option value="LEFT">Left</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {role === "COACH" && (
                  <div className="space-y-4">
                    <div className={isEdit ? "grid gap-4 sm:grid-cols-2" : ""}>
                      <div>
                        <label className={labelCls}>Fixed Monthly Salary (₹)</label>
                        <input name="fixedSalary" type="number" min={0} defaultValue={existing?.fixedSalary ?? 0} className={inputCls} />
                      </div>
                      {isEdit && (
                        <div>
                          <label className={labelCls}>Status</label>
                          <select name="status" defaultValue={existing?.status ?? "WORKING"} className={inputCls}>
                            <option value="WORKING">Working</option>
                            <option value="LEFT">Left</option>
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}>Experience (Years)</label>
                        <input name="experience" type="number" min={0} defaultValue={existing?.experience ?? ""} placeholder="e.g. 5" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Certifications</label>
                        <input name="certifications" defaultValue={existing?.certifications ?? ""} placeholder="e.g. FIG Level 1" className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className={labelCls}>Biography / Philosophy *</label>
                        <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                          {bioText.length}/160 characters
                        </span>
                      </div>
                      <textarea
                        name="bio"
                        rows={2}
                        maxLength={160}
                        required
                        value={bioText}
                        onChange={(e) => setBioText(e.target.value)}
                        placeholder="Short coaching bio or philosophy..."
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea name="notes" rows={3} defaultValue={existing?.notes ?? ""} placeholder="Any additional notes…" className={`${inputCls} resize-none`} />
                </div>
                {error && (
                  <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl px-3.5 py-2.5">
                    {error}
                  </p>
                )}
              </div>
              <div className="px-6 pb-6 pt-0 shrink-0">
                <button type="submit" disabled={pending} className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-orange-500 hover:bg-brand-orange-600 disabled:opacity-50 px-5 py-3 text-sm font-semibold text-white transition-colors cursor-pointer">
                  {pending ? "Saving…" : isEdit ? "Save changes" : "Save employee"}
                </button>
              </div>
            </form>
      </div>
    </div>
  );
}
// ─── Coach Card ────────────────────────────────────────────────────────────────

// ─── Coach Card ────────────────────────────────────────────────────────────────

function CoachCard({
  coach,
  onClick,
  onEdit,
  onToggleStatus,
  onTogglePayment,
  todayStatus,
  onMarkToday,
}: {
  coach: CoachWithStats;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onToggleStatus: (e: React.MouseEvent) => void;
  onTogglePayment: (year: number, month: number, paid: boolean, amount: number) => void;
  todayStatus: CoachAttendanceStatus | null;
  onMarkToday: (status: CoachAttendanceStatus) => void;
}) {
  const isWorking = coach.status === "WORKING";
  const [menuOpen, setMenuOpen] = useState(false);
  const [payMenuOpen, setPayMenuOpen] = useState(false);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-indexed

  // 1. Calculate Current Month Pay (This Mo Pay)
  let thisMonthCommission = 0;
  if (coach.role === "COACH" && coach.studentPlans) {
    for (const plan of coach.studentPlans) {
      const start = new Date(plan.startDate);
      const end = new Date(plan.endDate);
      const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
      const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
      const currentMonthDate = new Date(currentYear, currentMonth - 1, 1);
      if (currentMonthDate >= startMonth && currentMonthDate <= endMonth) {
        const commissionPercent = plan.commissionPercent ?? 50;
        const daysAttended = plan.attendances
          ? plan.attendances.filter((att: any) => {
              const d = new Date(att.date);
              const attYear = d.getUTCFullYear();
              const attMonth = d.getUTCMonth() + 1;
              return attYear === currentYear && attMonth === currentMonth;
            }).length
          : 0;
        const monthlyAmount = Math.round(
          (plan.pricePerSession ?? 0) * daysAttended * (commissionPercent / 100)
        );
        thisMonthCommission += monthlyAmount;
      }
    }
  }
  const thisMonthMultiplier = getMonthSalaryMultiplier(
    coach.joinDate,
    coach.leftDate ? new Date(coach.leftDate) : null,
    currentYear,
    currentMonth
  );
  const thisMonthPay = Math.round((coach.fixedSalary + thisMonthCommission) * thisMonthMultiplier);

  // 2. Calculate Last Month Date, Name, and Pay
  const lastMonthDate = new Date(currentYear, currentMonth - 2, 1);
  const lastMonthYear = lastMonthDate.getFullYear();
  const lastMonthMonth = lastMonthDate.getMonth() + 1;
  const lastMonthName = lastMonthDate.toLocaleString("en-US", { month: "short" });

  let lastMonthCommission = 0;
  if (coach.role === "COACH" && coach.studentPlans) {
    for (const plan of coach.studentPlans) {
      const start = new Date(plan.startDate);
      const end = new Date(plan.endDate);
      const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
      const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
      const lastMonthDateObj = new Date(lastMonthYear, lastMonthMonth - 1, 1);
      if (lastMonthDateObj >= startMonth && lastMonthDateObj <= endMonth) {
        const commissionPercent = plan.commissionPercent ?? 50;
        const daysAttended = plan.attendances
          ? plan.attendances.filter((att: any) => {
              const d = new Date(att.date);
              const attYear = d.getUTCFullYear();
              const attMonth = d.getUTCMonth() + 1;
              return attYear === lastMonthYear && attMonth === lastMonthMonth;
            }).length
          : 0;
        const monthlyAmount = Math.round(
          (plan.pricePerSession ?? 0) * daysAttended * (commissionPercent / 100)
        );
        lastMonthCommission += monthlyAmount;
      }
    }
  }
  const lastMonthMultiplier = getMonthSalaryMultiplier(
    coach.joinDate,
    coach.leftDate ? new Date(coach.leftDate) : null,
    lastMonthYear,
    lastMonthMonth
  );
  const lastMonthPay = Math.round((coach.fixedSalary + lastMonthCommission) * lastMonthMultiplier);

  // 3. Find Last Month's Payment Status
  const lastMonthPayment = coach.salaryPayments?.find(
    (p) => p.year === lastMonthYear && p.month === lastMonthMonth
  );
  const isPaid = lastMonthPayment?.paid ?? false;

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl border bg-white dark:bg-zinc-900 p-4 cursor-pointer hover:shadow-md transition-all ${isWorking
          ? "border-zinc-200 dark:border-zinc-800 hover:border-brand-orange-200 dark:hover:border-brand-orange-800/50"
          : "border-zinc-200/60 dark:border-zinc-800/60 opacity-70 hover:opacity-90"
        }`}
    >
      {/* Three-dot dropdown */}
      <div className="absolute top-3.5 right-3.5" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
            <nav className="absolute right-0 mt-1 w-44 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-1 shadow-2xl z-30 animate-menu-show">
              <button
                type="button"
                onClick={(e) => {
                  setMenuOpen(false);
                  onEdit(e);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-brand-orange-500 transition-colors cursor-pointer"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={(e) => {
                  setMenuOpen(false);
                  onToggleStatus(e);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-brand-orange-500 transition-colors cursor-pointer"
              >
                Mark as {isWorking ? "Left" : "Working"}
              </button>
            </nav>
          </>
        )}
      </div>

      {/* Header: Avatar + Identity */}
      <div className="flex items-start gap-3.5 pr-6">
        <img
          src={coach.avatarUrl || (coach.role === "STAFF" ? "/icons/staff-profile-placeholder.webp" : "/icons/coach-profile-placeholder.webp")}
          alt={coach.name}
          className="h-20 w-20 shrink-0 rounded-2xl object-cover bg-zinc-100 dark:bg-zinc-800"
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 truncate">{coach.name}</h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
            {coach.role === "COACH" ? "Coach" : "Staff"}
            {coach.timing && ` · ${coach.timing}`}
          </p>
          {coach.specialization && (
            <p className="text-xs font-semibold text-brand-orange-500 dark:text-brand-orange-400 mt-0.5 truncate">
              {coach.specialization}
            </p>
          )}
        </div>
      </div>

      {/* Info rows: left-aligned label + value */}
      <div className="mt-3.5 space-y-2">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <span className="text-zinc-400 dark:text-zinc-500">Phone: </span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{coach.contactNumber}</span>
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <span className="text-zinc-400 dark:text-zinc-500">Students: </span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            {coach.role === "COACH"
              ? `${coach.activeStudentCount} active`
              : "Non-training"}
          </span>
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <span className="text-zinc-400 dark:text-zinc-500">This Mo Pay: </span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">{INR(thisMonthPay)}</span>
        </p>
      </div>

      {/* Combined actions card: Pay + Attendance */}
      <div
        className="mt-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Last Month Pay row */}
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <div className="min-w-0 flex items-baseline gap-1.5">
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium shrink-0">{lastMonthName} Pay</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{INR(lastMonthPay)}</span>
          </div>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setPayMenuOpen(!payMenuOpen)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer transition-all hover:opacity-75 ${
                isPaid
                  ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                  : "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400"
              }`}
            >
              {isPaid && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isPaid ? "Paid" : "Unpaid"}
              <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {payMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setPayMenuOpen(false)} />
                <nav className="absolute right-0 bottom-10 w-32 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-1 shadow-2xl z-30 animate-menu-show-up">
                  {isPaid ? (
                    <button
                      type="button"
                      onClick={() => { setPayMenuOpen(false); onTogglePayment(lastMonthYear, lastMonthMonth, false, lastMonthPay); }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-brand-orange-500 transition-colors cursor-pointer"
                    >
                      Mark Unpaid
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setPayMenuOpen(false); onTogglePayment(lastMonthYear, lastMonthMonth, true, lastMonthPay); }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-brand-orange-500 transition-colors cursor-pointer"
                    >
                      Mark Paid
                    </button>
                  )}
                </nav>
              </>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-200/80 dark:border-zinc-700/50 mx-3" />

        {/* Attendance row */}
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">Today</span>
          <div className={`flex items-center rounded-xl p-0.5 gap-0.5 bg-zinc-200/70 dark:bg-zinc-700/60 ${!isWorking ? "opacity-40 pointer-events-none" : ""}`}>
            <button
              type="button"
              disabled={!isWorking}
              onClick={() => onMarkToday("PRESENT")}
              className={`rounded-[10px] px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                todayStatus === "PRESENT"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Present
            </button>
            <button
              type="button"
              disabled={!isWorking}
              onClick={() => onMarkToday("ABSENT")}
              className={`rounded-[10px] px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                todayStatus === "ABSENT"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Absent
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── Attendance Panel ─────────────────────────────────────────────────────────

function AttendancePanel({ coaches, todayStr }: { coaches: CoachWithStats[]; todayStr: string }) {
  const [dateStr, setDateStr] = useState(todayStr);
  const [attendance, setAttendance] = useState<Record<string, CoachAttendanceStatus | null>>(() => {
    const init: Record<string, CoachAttendanceStatus | null> = {};
    for (const c of coaches) {
      init[c.id] = (c as any).todayAttendance?.status ?? null;
    }
    return init;
  });
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const activeCoaches = coaches.filter((c) => c.status === "WORKING");

  const handleDateChange = (d: string) => {
    setDateStr(d);
    if (d === todayStr) {
      const init: Record<string, CoachAttendanceStatus | null> = {};
      for (const c of coaches) {
        init[c.id] = (c as any).todayAttendance?.status ?? null;
      }
      setAttendance(init);
    } else {
      const blank: Record<string, CoachAttendanceStatus | null> = {};
      for (const c of coaches) blank[c.id] = null;
      setAttendance(blank);
    }
  };

  const mark = async (coachId: string, status: CoachAttendanceStatus) => {
    const current = attendance[coachId];
    const newStatus = current === status ? null : status;
    setAttendance((prev) => ({ ...prev, [coachId]: newStatus }));
    setSaving((prev) => ({ ...prev, [coachId]: true }));
    try {
      if (newStatus !== null) {
        await markCoachAttendanceAction(coachId, dateStr, newStatus);
      }
      setSaved((prev) => ({ ...prev, [coachId]: true }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [coachId]: false })), 1500);
    } finally {
      setSaving((prev) => ({ ...prev, [coachId]: false }));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">Date</label>
        <input
          type="date"
          max={todayStr}
          value={dateStr}
          onChange={(e) => handleDateChange(e.target.value)}
          className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-orange-400/60 transition-all"
        />
        {dateStr === todayStr && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
            Today
          </span>
        )}
      </div>

      {activeCoaches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-10 text-center">
          <Dumbbell className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-3" />
          <p className="text-sm text-zinc-400 dark:text-zinc-500">No active coaches to mark attendance for.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeCoaches.map((coach) => {
            const status = attendance[coach.id];
            const isSaving = saving[coach.id];
            const isSaved = saved[coach.id];
            return (
              <div key={coach.id} className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-orange-100 dark:bg-brand-orange-950/40 text-brand-orange-600 dark:text-brand-orange-400 text-sm font-bold">
                    {coach.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{coach.name}</p>
                      {coach.role === "COACH" ? (
                        <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 px-1.5 py-0.5 text-[9px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wide">
                          <Dumbbell className="h-2 w-2" />
                          Coach
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 px-1.5 py-0.5 text-[9px] font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wide">
                          <Briefcase className="h-2 w-2" />
                          Staff
                        </span>
                      )}
                    </div>
                    {coach.timing && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{coach.timing}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isSaved && <span className="text-xs text-emerald-500 font-medium">Saved</span>}
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => mark(coach.id, "PRESENT")}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${status === "PRESENT"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-400"
                      }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Present
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => mark(coach.id, "ABSENT")}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${status === "ABSENT"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 dark:hover:text-rose-400"
                      }`}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Absent
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Earnings Portal ──────────────────────────────────────────────────────────

function EarningsPortal({ coachId }: { coachId: string }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState<CoachEarningRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });

  const navigate = (dir: -1 | 1) => {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m);
    setYear(y);
  };

  const loadEarnings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCoachEarningsAction(coachId);
      setRows((result.rows as any) ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  const monthRows = (rows ?? []).filter((r) =>
    r.months.some((m) => m.year === year && m.month === month)
  );

  const totalThisMonth = monthRows.reduce((sum, r) => {
    const m = r.months.find((m) => m.year === year && m.month === month);
    return sum + (m?.amount ?? 0);
  }, 0);

  return (
    <div className="space-y-5">
      {/* Month nav */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="h-9 w-9 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 min-w-[140px] text-center">{monthLabel}</span>
        <button type="button" onClick={() => navigate(1)} disabled={year === now.getFullYear() && month === now.getMonth() + 1} className="h-9 w-9 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-orange-500 to-brand-orange-600 p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-orange-100">Earnings — {monthLabel}</p>
        <p className="mt-2 text-3xl font-black">{INR(totalThisMonth)}</p>
        <p className="text-xs text-brand-orange-100 mt-1">
          from {monthRows.length} student{monthRows.length !== 1 ? "s" : ""} · personal training plans
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : monthRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center">
          <TrendingUp className="mx-auto h-7 w-7 text-zinc-300 dark:text-zinc-600 mb-2" />
          <p className="text-sm text-zinc-400 dark:text-zinc-500">No personal training students for {monthLabel}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {monthRows.map((row) => {
            const mData = row.months.find((m) => m.year === year && m.month === month);
            return (
              <div key={row.studentPlanId} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-orange-100 dark:bg-brand-orange-950/40 text-brand-orange-600 text-xs font-bold">
                        {row.studentName.charAt(0)}
                      </span>
                      <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">{row.studentName}</p>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">TAG {row.studentNumber}</span>
                    </div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5 ml-9">
                      {fmtDate(row.planStartDate)} → {fmtDate(row.planEndDate)} · {row.planMonths} month{row.planMonths !== 1 ? "s" : ""}
                    </p>
                    <div className="ml-9 mt-2 flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>Total: <strong className="text-zinc-700 dark:text-zinc-300">{INR(row.totalFee)}</strong></span>
                      <span>Coach {row.commissionPercent || 50}%: <strong className="text-brand-orange-500">{INR(row.coachShare)}</strong></span>
                      <span>Per month: <strong className="text-zinc-700 dark:text-zinc-300">{INR(row.monthlyAmount)}</strong></span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-black text-brand-orange-500">{INR(mData?.amount ?? 0)}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">this month</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}



// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CoachesPageClient({ coaches: initialCoaches, todayStr }: Props) {
  const router = useRouter();
  const [coaches] = useState(initialCoaches);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editCoach, setEditCoach] = useState<CoachWithStats | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "WORKING" | "LEFT">("WORKING");
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [chosenRole, setChosenRole] = useState<CoachRole>("COACH");
  const [leftModalCoach, setLeftModalCoach] = useState<CoachWithStats | null>(null);
  const [leftModalStatus, setLeftModalStatus] = useState<"loading" | "success" | null>(null);

  // Pay modal state — shows loading → success (with Close + Download Slip) when marking paid
  const [payModalCoach, setPayModalCoach] = useState<CoachWithStats | null>(null);
  const [payModalInfo, setPayModalInfo] = useState<{ year: number; month: number } | null>(null);
  const [payModalStatus, setPayModalStatus] = useState<"loading" | "success" | null>(null);


  const [activePrintSlip, setActivePrintSlip] = useState<any | null>(null);

  const handlePrintSlip = async (coachId: string, year: number, month: number) => {
    try {
      const res = await getSalarySlipDataAction(coachId, year, month);
      if (res.success && res.data) {
        const coach = coaches.find((c) => c.id === coachId);
        const firstName = coach?.name.trim().split(/\s+/)[0]?.toLowerCase() || "employee";
        const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-US", { month: "short" }).toLowerCase();
        const newTitle = `TAG-${firstName}-${monthLabel}-${year}-salary-slip`;
        
        document.title = newTitle;
        const titleEl = document.querySelector('title');
        if (titleEl) {
          titleEl.textContent = newTitle;
        }

        setActivePrintSlip(res.data);
      } else {
        alert(res.message || "Failed to load salary slip data");
      }
    } catch {
      alert("Error loading salary slip data");
    }
  };

  useEffect(() => {
    if (activePrintSlip) {
      const timer = setTimeout(() => {
        window.print();
        
        const standardTitle = "Coaches — TAG CRM";
        document.title = standardTitle;
        const titleEl = document.querySelector('title');
        if (titleEl) {
          titleEl.textContent = standardTitle;
        }
        
        setActivePrintSlip(null);
        window.location.reload();
      }, 600);
      return () => {
        clearTimeout(timer);
        const standardTitle = "Coaches — TAG CRM";
        document.title = standardTitle;
        const titleEl = document.querySelector('title');
        if (titleEl) {
          titleEl.textContent = standardTitle;
        }
      };
    }
  }, [activePrintSlip]);

  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  // Close header mobile menu on outside click
  useEffect(() => {
    if (!headerMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [headerMenuOpen]);

  // Shared today attendance state — initialised from server data, updated optimistically
  const [todayAttendance, setTodayAttendance] = useState<Record<string, CoachAttendanceStatus | null>>(() => {
    const init: Record<string, CoachAttendanceStatus | null> = {};
    for (const c of initialCoaches) {
      init[c.id] = (c as any).todayAttendance?.status ?? null;
    }
    return init;
  });

  const markToday = async (coachId: string, status: CoachAttendanceStatus) => {
    const current = todayAttendance[coachId];
    // Toggle off if same status clicked again
    const next = current === status ? null : status;
    setTodayAttendance((prev) => ({ ...prev, [coachId]: next }));
    if (next !== null) {
      await markCoachAttendanceAction(coachId, todayStr, next);
    } else {
      await deleteCoachAttendanceAction(coachId, todayStr);
    }
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleCoachStatus = async (coach: CoachWithStats) => {
    const nextStatus = coach.status === "WORKING" ? "LEFT" : "WORKING";

    if (nextStatus === "LEFT") {
      setLeftModalCoach(coach);
      setLeftModalStatus("loading");

      const startTime = Date.now();
      const result = await toggleCoachStatusAction(coach.id, "LEFT");

      // Ensure spinner is visible for at least 800ms for smooth UX
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 800 - elapsed);
      await new Promise((resolve) => setTimeout(resolve, remaining));

      if (result.success) {
        setLeftModalStatus("success");
      } else {
        setLeftModalCoach(null);
        setLeftModalStatus(null);
        showToast("error", result.message ?? "Failed to update status");
      }
    } else {
      const result = await toggleCoachStatusAction(coach.id, "WORKING");
      if (result.success) {
        showToast("success", `Marked ${coach.name} as Working`);
        window.location.reload();
      } else {
        showToast("error", result.message ?? "Failed to update status");
      }
    }
  };

  const handleTogglePayment = async (coachId: string, year: number, month: number, paid: boolean, amount: number) => {
    if (paid) {
      // Find the coach object for the modal
      const coach = coaches.find((c) => c.id === coachId) ?? null;
      setPayModalCoach(coach);
      setPayModalInfo({ year, month });
      setPayModalStatus("loading");

      const startTime = Date.now();
      try {
        const result = await toggleCoachSalaryPaymentAction(coachId, year, month, paid, amount);
        const elapsed = Date.now() - startTime;
        await new Promise((resolve) => setTimeout(resolve, Math.max(0, 800 - elapsed)));

        if (result.success) {
          setPayModalStatus("success");
        } else {
          setPayModalCoach(null);
          setPayModalInfo(null);
          setPayModalStatus(null);
          showToast("error", result.message ?? "Failed to update payment status");
        }
      } catch {
        setPayModalCoach(null);
        setPayModalInfo(null);
        setPayModalStatus(null);
        showToast("error", "An error occurred");
      }
    } else {
      // Marking unpaid — just do it silently and reload
      try {
        const result = await toggleCoachSalaryPaymentAction(coachId, year, month, paid, amount);
        if (result.success) {
          showToast("success", "Marked as Unpaid");
          window.location.reload();
        } else {
          showToast("error", result.message ?? "Failed to update payment status");
        }
      } catch {
        showToast("error", "An error occurred");
      }
    }
  };

  const filtered = useMemo(() => {
    return [...coaches]
      .filter((c) => statusFilter === "ALL" || c.status === statusFilter)
      .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
  }, [coaches, statusFilter]);

  return (
    <div className="space-y-6 min-w-0 w-full relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg animate-fade-in ${toast.type === "success" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30" : "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-900/30"}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-zinc-900 dark:text-zinc-50">Coach &amp; Staff</h1>
        </div>

        <div className="relative" ref={headerMenuRef}>
          {/* Desktop buttons — hidden on mobile */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/admin/coaches/attendance"
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer shadow-sm"
            >
              <Calendar className="h-4 w-4 text-brand-orange-500" />
              Attendance
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setAddDropdownOpen(!addDropdownOpen)}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add Employee
              </button>

              {addDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setAddDropdownOpen(false)} />
                  <nav className="absolute right-0 mt-2 w-48 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 shadow-2xl z-40 animate-menu-show">
                    <button
                      type="button"
                      onClick={() => {
                        setChosenRole("COACH");
                        setAddModalOpen(true);
                        setAddDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-brand-orange-500 dark:hover:text-brand-orange-400 font-semibold transition-colors cursor-pointer flex items-center gap-2.5"
                    >
                      <Dumbbell className="h-4 w-4 text-brand-orange-500" />
                      Add Coach
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChosenRole("STAFF");
                        setAddModalOpen(true);
                        setAddDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-brand-orange-500 dark:hover:text-brand-orange-400 font-semibold transition-colors cursor-pointer flex items-center gap-2.5"
                    >
                      <Briefcase className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                      Add Staff
                    </button>
                  </nav>
                </>
              )}
            </div>
          </div>

          {/* Mobile three-dot menu */}
          <div className="sm:hidden">
            <button
              type="button"
              onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
              className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {headerMenuOpen && (
              <nav className="absolute right-0 mt-2 w-52 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-2xl py-1.5 overflow-hidden z-50 animate-menu-show">
                <Link
                  href="/admin/coaches/attendance"
                  onClick={() => setHeaderMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Calendar className="h-4 w-4 text-brand-orange-500" />
                  View Attendance
                </Link>
                <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                <button
                  type="button"
                  onClick={() => {
                    setChosenRole("COACH");
                    setAddModalOpen(true);
                    setHeaderMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-brand-orange-500 transition-colors cursor-pointer"
                >
                  <Dumbbell className="h-4 w-4 text-brand-orange-500" />
                  Add Coach
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChosenRole("STAFF");
                    setAddModalOpen(true);
                    setHeaderMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-brand-orange-500 transition-colors cursor-pointer"
                >
                  <Briefcase className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                  Add Staff
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-center gap-2">
          {(["WORKING", "LEFT", "ALL"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${statusFilter === f ? "bg-brand-orange-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
            >
              {f === "WORKING" ? "Working" : f === "LEFT" ? "Left" : "All"}
              {" "}
              <span className="opacity-60">
                ({f === "ALL" ? coaches.length : coaches.filter((c) => c.status === f).length})
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-orange-100 dark:bg-brand-orange-950/40 text-brand-orange-500 mb-5">
              <Dumbbell className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {statusFilter === "ALL" ? "No coaches yet" : `No ${statusFilter.toLowerCase()} coaches`}
            </h3>
            <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500 max-w-xs">
              {statusFilter === "ALL"
                ? "Add your first coach to get started with personal training plans and attendance tracking."
                : "Try switching the filter above."}
            </p>
            {statusFilter === "ALL" && (
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-5 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add your first coach
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((coach) => (
              <CoachCard
                key={coach.id}
                coach={coach}
                todayStatus={todayAttendance[coach.id] ?? null}
                onMarkToday={(status) => markToday(coach.id, status)}
                onClick={() => router.push(`/admin/coaches/${coach.id}`)}
                onEdit={(e) => { e.stopPropagation(); setEditCoach(coach); }}
                onToggleStatus={(e) => { e.stopPropagation(); toggleCoachStatus(coach); }}
                onTogglePayment={(year, month, paid, amount) => handleTogglePayment(coach.id, year, month, paid, amount)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Coach Modal */}
      {addModalOpen && (
        <CoachFormModal
          initialRole={chosenRole}
          onClose={() => setAddModalOpen(false)}
          onSaved={(msg) => { showToast("success", msg); window.location.reload(); }}
        />
      )}

      {/* Edit Coach Modal */}
      {editCoach && (
        <CoachFormModal
          existing={editCoach}
          onClose={() => setEditCoach(null)}
          onSaved={(msg) => { showToast("success", msg); setEditCoach(null); window.location.reload(); }}
        />
      )}

      {/* Mark As Left Modal (Loading & Success popup) */}
      {leftModalCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="relative w-full max-w-sm rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/60 p-8 shadow-2xl flex flex-col items-center text-center animate-scale-in"
            style={{ boxShadow: "0 32px 64px -12px rgba(0,0,0,0.25)" }}
          >
            {leftModalStatus === "loading" ? (
              <div className="flex flex-col items-center space-y-4 py-4">
                <Loader2 className="w-12 h-12 text-brand-orange-500 animate-spin" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Marking as Left
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                  Please wait while we update {leftModalCoach.name}&apos;s status and calculate salary...
                </p>
              </div>
            ) : leftModalStatus === "success" ? (
              <div className="flex flex-col items-center py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 mb-5 animate-scale-in">
                  <Check className="h-8 w-8 stroke-[3]" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Success
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 font-medium">
                  This person is marked as left.
                </p>
                
                <button
                  type="button"
                  onClick={() => {
                    setLeftModalCoach(null);
                    setLeftModalStatus(null);
                    window.location.reload();
                  }}
                  className="mt-6 w-full inline-flex items-center justify-center rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-sm font-semibold text-white dark:text-zinc-900 px-5 py-3 transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Mark As Paid Modal (Loading → Success with Close + Download Slip) */}
      {payModalCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="relative w-full max-w-sm rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/60 p-8 shadow-2xl flex flex-col items-center text-center animate-scale-in"
            style={{ boxShadow: "0 32px 64px -12px rgba(0,0,0,0.25)" }}
          >
            {payModalStatus === "loading" ? (
              <div className="flex flex-col items-center space-y-4 py-4">
                <Loader2 className="w-12 h-12 text-brand-orange-500 animate-spin" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Recording Payment
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                  Please wait while we mark {payModalCoach.name}&apos;s salary as paid...
                </p>
              </div>
            ) : payModalStatus === "success" ? (
              <div className="flex flex-col items-center py-4 w-full">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 mb-5 animate-scale-in">
                  <Check className="h-8 w-8 stroke-[3]" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Payment Recorded!
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
                  {payModalCoach.name}&apos;s salary has been marked as paid.
                </p>

                <div className="mt-6 flex gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setPayModalCoach(null);
                      setPayModalInfo(null);
                      setPayModalStatus(null);
                      window.location.reload();
                    }}
                    className="flex-1 inline-flex items-center justify-center rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 px-4 py-3 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (payModalInfo) {
                        handlePrintSlip(payModalCoach.id, payModalInfo.year, payModalInfo.month);
                      }
                      setPayModalCoach(null);
                      setPayModalInfo(null);
                      setPayModalStatus(null);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-sm font-semibold text-white dark:text-zinc-900 px-4 py-3 transition-colors cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    Download Slip
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Print styles and hidden salary slip container */}
      {activePrintSlip && (
        <>
          <style dangerouslySetInnerHTML={{__html: `
            @page {
              size: A4;
              margin: 0 !important;
            }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                overflow: hidden !important;
                background: white !important;
              }
              body * {
                visibility: hidden !important;
              }
              #print-slip-container,
              #print-slip-container * {
                visibility: visible !important;
              }
              #print-slip-container {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                background: white !important;
                border: none !important;
              }
            }
          `}} />
          <div
            id="print-slip-container"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 99999,
              backgroundColor: "white",
              display: "none",
            }}
          >
            <SalarySlip data={activePrintSlip} />
          </div>
        </>
      )}
    </div>
  );
}
