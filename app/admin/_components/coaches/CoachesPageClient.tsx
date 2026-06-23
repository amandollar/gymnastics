"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
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
} from "lucide-react";
import {
  createCoachAction,
  updateCoachAction,
  markCoachAttendanceAction,
  getCoachEarningsAction,
} from "@/lib/actions/coaches";
import type { CoachWithStats } from "@/lib/services/coaches";
import type { CoachAttendanceStatus, CoachRole } from "@prisma/client";
import StudentAvatarPicker from "@/app/admin/_components/students/StudentAvatarPicker";

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
  months: { year: number; month: number; label: string; amount: number }[];
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
  onClose,
  onSaved,
}: {
  existing?: CoachWithStats | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!existing;
  const [role, setRole] = useState<CoachRole>(existing?.role ?? "COACH");
  const [step, setStep] = useState<"CHOOSE_ROLE" | "FORM">(isEdit ? "FORM" : "CHOOSE_ROLE");

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
        {step === "CHOOSE_ROLE" ? (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-orange-100 dark:bg-brand-orange-950/40 text-brand-orange-600 dark:text-brand-orange-400">
                  <Dumbbell className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Add Employee
                </h2>
              </div>
              <button type="button" onClick={onClose} className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-8 space-y-6 flex-1 overflow-y-auto">
              <div className="text-center space-y-1.5">
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Select Employee Type</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Choose the role of the employee you want to add to customize the form.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setRole("COACH");
                    setStep("FORM");
                  }}
                  className="flex flex-col items-center text-center p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-brand-orange-500 dark:hover:border-brand-orange-500/50 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer group shadow-sm text-left"
                >
                  <div className="h-12 w-12 rounded-xl bg-brand-orange-100 dark:bg-brand-orange-950/40 text-brand-orange-600 dark:text-brand-orange-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Dumbbell className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-100 text-sm">Coach / Trainer</h4>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 leading-relaxed text-center">
                    Athletic or personal trainers. Calculates session share and manages client plans.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole("STAFF");
                    setStep("FORM");
                  }}
                  className="flex flex-col items-center text-center p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-brand-orange-500 dark:hover:border-brand-orange-500/50 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer group shadow-sm text-left"
                >
                  <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-100 text-sm">Staff Employee</h4>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 leading-relaxed text-center">
                    Front desk, admin or facility staff. Fixed monthly salary with simple absent deductions.
                  </p>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                {!isEdit && (
                  <button
                    type="button"
                    onClick={() => setStep("CHOOSE_ROLE")}
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer mr-1"
                    title="Go back to role selection"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
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
                      currentAvatarUrl={existing?.avatarUrl || "/coach-profile-placeholder.webp"}
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
          </>
        )}
      </div>
    </div>
  );
}
// ─── Coach Card ────────────────────────────────────────────────────────────────

function CoachCard({
  coach,
  todayStatus,
  onMark,
  onClick,
  onEdit,
}: {
  coach: CoachWithStats;
  todayStatus: CoachAttendanceStatus | null;
  onMark: (e: React.MouseEvent, status: CoachAttendanceStatus) => void;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
}) {
  const isWorking = coach.status === "WORKING";
  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl border bg-white dark:bg-zinc-900 p-5 cursor-pointer hover:shadow-md transition-all ${isWorking
          ? "border-zinc-200 dark:border-zinc-800 hover:border-brand-orange-200 dark:hover:border-brand-orange-800/50"
          : "border-zinc-200/60 dark:border-zinc-800/60 opacity-70 hover:opacity-90"
        }`}
    >
      <div className="absolute top-4 right-4">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${isWorking ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isWorking ? "bg-emerald-500" : "bg-zinc-400"}`} />
          {isWorking ? "Working" : "Left"}
        </span>
      </div>

      <div className="flex items-start gap-4 mb-4">
        <img
          src={coach.avatarUrl || "/coach-profile-placeholder.webp"}
          alt={coach.name}
          className="h-12 w-12 shrink-0 rounded-2xl object-cover bg-zinc-100 dark:bg-zinc-800"
        />
        <div className="min-w-0 flex-1 pr-16">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{coach.name}</h3>
            {coach.role === "COACH" ? (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-sky-100 dark:bg-sky-900/30 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wide">
                <Dumbbell className="h-2.5 w-2.5" />
                Coach
              </span>
            ) : (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wide">
                <Briefcase className="h-2.5 w-2.5" />
                Staff
              </span>
            )}
          </div>
          {coach.specialization && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{coach.specialization}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          <span className="truncate">{coach.contactNumber}</span>
        </div>
        {coach.timing && (
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <span className="truncate">{coach.timing}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          <span>Joined {fmtDate(coach.joinDate)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <IndianRupee className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          <span>{INR(coach.fixedSalary)} / month fixed</span>
        </div>
      </div>

      {/* Footer: coach-only stats + attendance + edit */}
      <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {coach.role === "COACH"
              ? `${coach.activeStudentCount} active student${coach.activeStudentCount !== 1 ? "s" : ""}`
              : "Non-training staff"}
          </span>
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-brand-orange-500 transition-colors cursor-pointer"
          >
            <Edit2 className="h-3 w-3" />
            Edit
          </button>
        </div>

        {/* Today's attendance — only for working coaches */}
        {coach.role === "COACH" && isWorking && (
          <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 shrink-0">Today</span>
            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                onClick={(e) => onMark(e, "PRESENT")}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${todayStatus === "PRESENT"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400"
                  }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                Present
              </button>
              <button
                type="button"
                onClick={(e) => onMark(e, "ABSENT")}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${todayStatus === "ABSENT"
                    ? "bg-rose-500 text-white shadow-sm"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400"
                  }`}
              >
                <XCircle className="h-3 w-3" />
                Absent
              </button>
            </div>
          </div>
        )}
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
    }
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const filtered = coaches.filter((c) => statusFilter === "ALL" || c.status === statusFilter);

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
          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-zinc-900 dark:text-zinc-50">Employees</h1>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
            {coaches.filter((c) => c.status === "WORKING").length} active employee{coaches.filter((c) => c.status === "WORKING").length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/coaches/attendance"
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer shadow-sm"
          >
            <Calendar className="h-4 w-4 text-brand-orange-500" />
            View Attendance
          </Link>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </button>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((coach) => (
              <CoachCard
                key={coach.id}
                coach={coach}
                todayStatus={todayAttendance[coach.id] ?? null}
                onMark={(e, status) => { e.stopPropagation(); markToday(coach.id, status); }}
                onClick={() => router.push(`/admin/coaches/${coach.id}`)}
                onEdit={(e) => { e.stopPropagation(); setEditCoach(coach); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Coach Modal */}
      {addModalOpen && (
        <CoachFormModal
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
    </div>
  );
}
