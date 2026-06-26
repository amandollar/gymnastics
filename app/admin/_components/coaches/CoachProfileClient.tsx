"use client";

import { useState, useTransition, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  X,
  Calendar,
  Phone,
  Clock,
  TrendingUp,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  Edit2,
  ArrowLeft,
  Check,
  Loader2,
  Printer,
} from "lucide-react";
import {
  updateCoachAction,
  markCoachAttendanceAction,
  deleteCoachAttendanceAction,
  getCoachEarningsAction,
  toggleCoachSalaryPaymentAction,
} from "@/lib/actions/coaches";
import type { CoachAttendanceStatus, CoachRole } from "@prisma/client";
import StudentAvatarPicker from "@/app/admin/_components/students/StudentAvatarPicker";
import { getMonthSalaryMultiplier } from "@/lib/utils/salary";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CoachData {
  id: string;
  name: string;
  contactNumber: string;
  email: string | null;
  joinDate: string;
  leftDate?: string | null;
  timing: string | null;
  specialization: string | null;
  fixedSalary: number;
  status: "WORKING" | "LEFT";
  role: CoachRole;
  notes: string | null;
  address: string | null;
  avatarUrl: string | null;
  bio?: string | null;
  experience?: number | null;
  certifications?: string | null;
  createdAt: string;
  updatedAt: string;
  attendances: {
    id: string;
    date: string;
    status: CoachAttendanceStatus;
  }[];
  studentPlans: {
    id: string;
    startDate: string;
    endDate: string;
    fee: number;
    planMonths: number;
    isActive: boolean;
    commissionPercent: number;
    student: {
      id: string;
      name: string;
      studentNumber: number;
    };
  }[];
  salaryPayments: {
    id: string;
    year: number;
    month: number;
    amount: number;
    paid: boolean;
    paidAt: string | null;
  }[];
}

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
  coach: CoachData;
  todayStr: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const toInputDate = (d: Date) => d.toISOString().split("T")[0];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
  existing: CoachData;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<CoachRole>(existing.role);
  const [bioText, setBioText] = useState(existing.bio ?? "");

  const [startTime, setStartTime] = useState(() => {
    if (existing.timing) {
      const parts = existing.timing.split(/ – | - /);
      return parts[0] || "7:00 AM";
    }
    return "7:00 AM";
  });
  const [endTime, setEndTime] = useState(() => {
    if (existing.timing) {
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
      const result = await updateCoachAction(existing.id, null, formData);
      if (result.success) {
        onSaved(result.message ?? "Employee updated successfully");
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
              Edit Employee Details
            </h2>
          </div>
          <button type="button" onClick={onClose} className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-4">
            {role === "COACH" && (
              <div className="flex justify-center pb-2">
                <StudentAvatarPicker
                  currentAvatarUrl={existing.avatarUrl || "/coach-profile-placeholder.webp"}
                />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input name="name" required defaultValue={existing.name} placeholder="Full name" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Contact Number *</label>
                <input name="contactNumber" required defaultValue={existing.contactNumber} placeholder="+91 98765 43210" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input name="email" type="email" defaultValue={existing.email ?? ""} placeholder="employee@example.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Address *</label>
              <input name="address" required defaultValue={existing.address ?? ""} placeholder="Residential Address" className={inputCls} />
            </div>
            {role === "COACH" ? (
              <>
                <div>
                  <label className={labelCls}>Join Date *</label>
                  <input name="joinDate" type="date" required defaultValue={toInputDate(new Date(existing.joinDate))} className={inputCls} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Specialization</label>
                    <input name="specialization" defaultValue={existing.specialization ?? ""} placeholder="e.g. Gymnastics" className={inputCls} />
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Role *</label>
                    <select
                       name="role"
                       value={role}
                       onChange={(e) => setRole(e.target.value as CoachRole)}
                       className={inputCls}
                    >
                      <option value="COACH">Coach / Trainer</option>
                      <option value="STAFF">Staff Employee</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Fixed Salary (₹)</label>
                    <input name="fixedSalary" type="number" min={0} defaultValue={existing.fixedSalary} className={inputCls} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Experience (Years)</label>
                    <input name="experience" type="number" min={0} defaultValue={existing.experience ?? ""} placeholder="e.g. 5" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Certifications</label>
                    <input name="certifications" defaultValue={existing.certifications ?? ""} placeholder="e.g. FIG Level 1" className={inputCls} />
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
              </>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Join Date *</label>
                    <input name="joinDate" type="date" required defaultValue={toInputDate(new Date(existing.joinDate))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Role *</label>
                    <select
                      name="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as CoachRole)}
                      className={inputCls}
                    >
                      <option value="COACH">Coach / Trainer</option>
                      <option value="STAFF">Staff Employee</option>
                    </select>
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
                  <div>
                    <label className={labelCls}>Fixed Monthly Salary (₹)</label>
                    <input name="fixedSalary" type="number" min={0} defaultValue={existing.fixedSalary} className={inputCls} />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className={labelCls}>Status</label>
              <select name="status" defaultValue={existing.status} className={inputCls}>
                <option value="WORKING">Working</option>
                <option value="LEFT">Left</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea name="notes" rows={3} defaultValue={existing.notes ?? ""} placeholder="Any additional notes…" className={`${inputCls} resize-none`} />
            </div>
            {error && (
              <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}
          </div>
          <div className="px-6 pb-6 pt-0 shrink-0">
            <button type="submit" disabled={pending} className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-orange-500 hover:bg-brand-orange-600 disabled:opacity-50 px-5 py-3 text-sm font-semibold text-white transition-colors cursor-pointer">
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Profile View Client Component ─────────────────────────────────────

export default function CoachProfileClient({ coach, todayStr }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const now = new Date();

  // Attendance log sidebar toggle
  const [showLogs, setShowLogs] = useState(false);

  // Attendance popup states
  const [activeMarkDate, setActiveMarkDate] = useState<{
    year: number;
    monthZeroIndex: number;
    day: number;
    dateStr: string;
  } | null>(null);
  const [savingModal, setSavingModal] = useState(false);

  // Local state for attendance records
  const [attendance, setAttendance] = useState<Record<string, CoachAttendanceStatus>>(() => {
    const map: Record<string, CoachAttendanceStatus> = {};
    for (const a of coach.attendances) {
      const dateStr = new Date(a.date).toISOString().split("T")[0];
      map[dateStr] = a.status;
    }
    return map;
  });
  const [updatingCells, setUpdatingCells] = useState<Record<string, boolean>>({});

  // Local state for salary payments
  const [paymentsState, setPaymentsState] = useState<Record<string, { paid: boolean; loading: boolean }>>(() => {
    const map: Record<string, { paid: boolean; loading: boolean }> = {};
    if (coach.salaryPayments) {
      for (const p of coach.salaryPayments) {
        map[`${p.year}-${p.month}`] = { paid: p.paid, loading: false };
      }
    }
    return map;
  });

  const handleTogglePayment = async (year: number, month: number, amount: number) => {
    const key = `${year}-${month}`;
    const current = paymentsState[key] || { paid: false, loading: false };
    const nextPaidState = !current.paid;

    // 1. Optimistic Update
    setPaymentsState((prev) => ({
      ...prev,
      [key]: { paid: nextPaidState, loading: true },
    }));

    try {
      const res = await toggleCoachSalaryPaymentAction(coach.id, year, month, nextPaidState, amount);
      if (res.success) {
        showToast("success", res.message ?? "Payment status updated");
      } else {
        showToast("error", res.message ?? "Failed to update payment status");
        // Revert
        setPaymentsState((prev) => ({
          ...prev,
          [key]: { paid: current.paid, loading: false },
        }));
      }
    } catch (err) {
      console.error(err);
      showToast("error", "An error occurred");
      // Revert
      setPaymentsState((prev) => ({
        ...prev,
        [key]: { paid: current.paid, loading: false },
      }));
    } finally {
      setPaymentsState((prev) => ({
        ...prev,
        [key]: { ...prev[key], loading: false },
      }));
    }
  };

  // Revenue calculation states
  const [earningsRows, setEarningsRows] = useState<CoachEarningRow[]>([]);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isWorking = coach.status === "WORKING";
  const activeStudentCount = useMemo(() => {
    return coach.studentPlans.filter((p) => p.isActive).length;
  }, [coach.studentPlans]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all earnings for the coach on mount
  const fetchEarnings = useCallback(async () => {
    setLoadingEarnings(true);
    try {
      const res = await getCoachEarningsAction(coach.id);
      if (res.success) {
        setEarningsRows((res.rows as any) ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEarnings(false);
    }
  }, [coach.id]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);



  // ── Multi-month Calendar Span Calculations (Same as Student Profile) ──────

  const calendarStart = useMemo(() => {
    // Show up to 6 months of history by default, starting from join date
    const joinDateObj = new Date(coach.joinDate);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    return joinDateObj > sixMonthsAgo ? joinDateObj : sixMonthsAgo;
  }, [coach.joinDate]);

  const calendarEnd = useMemo(() => {
    return new Date(); // ends at current month
  }, []);

  const calendarMonths = useMemo(() => {
    const list: { year: number; month: number }[] = [];
    const curr = new Date(calendarStart.getFullYear(), calendarStart.getMonth(), 1);
    const last = new Date(calendarEnd.getFullYear(), calendarEnd.getMonth(), 1);

    let safety = 0;
    while (curr <= last && safety < 12) {
      list.push({ year: curr.getFullYear(), month: curr.getMonth() });
      curr.setMonth(curr.getMonth() + 1);
      safety++;
    }
    if (list.length === 0) {
      list.push({ year: now.getFullYear(), month: now.getMonth() });
    }
    return list;
  }, [calendarStart, calendarEnd, now]);

  // Scroll to the end (current month) on mount
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollLeft = container.scrollWidth;
      const timer = setTimeout(() => {
        container.scrollLeft = container.scrollWidth;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [calendarMonths]);

  // Format the selected date for modal heading
  const formattedModalDate = useMemo(() => {
    if (!activeMarkDate) return "";
    const d = new Date(activeMarkDate.year, activeMarkDate.monthZeroIndex, activeMarkDate.day);
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [activeMarkDate]);

  // Handle saving attendance status from modal
  const saveStatus = async (status: CoachAttendanceStatus | null) => {
    if (!activeMarkDate) return;
    const { dateStr } = activeMarkDate;
    const currentStatus = attendance[dateStr] || null;

    setSavingModal(true);

    // 1. Optimistic Update
    setAttendance((prev) => {
      const copy = { ...prev };
      if (status === null) {
        delete copy[dateStr];
      } else {
        copy[dateStr] = status;
      }
      return copy;
    });

    try {
      // 2. Perform DB Updates
      if (status === null) {
        await deleteCoachAttendanceAction(coach.id, dateStr);
      } else {
        await markCoachAttendanceAction(coach.id, dateStr, status);
      }
      setActiveMarkDate(null);
    } catch (err) {
      console.error(err);
      // Revert on error
      setAttendance((prev) => {
        const copy = { ...prev };
        if (currentStatus === null) {
          delete copy[dateStr];
        } else {
          copy[dateStr] = currentStatus;
        }
        return copy;
      });
    } finally {
      setSavingModal(false);
    }
  };

  // Attendance log list sorted chronologically (reversed for newest first)
  const attendanceLogsList = useMemo(() => {
    return Object.entries(attendance)
      .map(([dateStr, status]) => ({ dateStr, status }))
      .sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }, [attendance]);

  // ── Revenue Share Calculation ─────────────────────────────────────────────

  const paymentMonths = useMemo(() => {
    return [...calendarMonths].reverse();
  }, [calendarMonths]);

  return (
    <div className="space-y-6 min-w-0 pb-10">
      {/* Toast popup */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg animate-fade-in ${toast.type === "success" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30" : "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-900/30"}`}>
          {toast.message}
        </div>
      )}

      {/* Breadcrumb back link and Header action bar */}
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/coaches"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-brand-orange-500 dark:hover:text-brand-orange-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Employees
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-2xl sm:text-4xl font-light tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
              Employee Profile
            </h1>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${isWorking ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isWorking ? "bg-emerald-500" : "bg-zinc-400"}`} />
              {isWorking ? "Working" : "Left"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
          >
            <Edit2 className="h-3.5 w-3.5 text-brand-orange-500" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Two-column Layout (Identical grid system spacing to Student Profile) */}
      <div className="grid gap-5 lg:grid-cols-[300px_1fr] min-w-0">
        {/* ── Left Column: Avatar + Profile Info + Assigned Personal Training Plans ── */}
        <div className="space-y-4 min-w-0">
          {/* Avatar and Coach name card */}
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <img
              src={coach.avatarUrl || (coach.role === "STAFF" ? "/staff-profile-placeholder.webp" : "/coach-profile-placeholder.webp")}
              alt={coach.name}
              className="h-48 w-48 shrink-0 rounded-3xl object-cover bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 shadow-xs"
            />
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {coach.name}
              </h2>
              {coach.role === "COACH" ? (
                coach.specialization && (
                  <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                    {coach.specialization}
                  </p>
                )
              ) : (
                <p className="text-xs font-medium text-blue-500 dark:text-blue-400 mt-0.5 truncate">
                  Staff Employee
                </p>
              )}
            </div>
          </div>

          {/* Details list card */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">Phone</dt>
                <dd className="font-medium text-right">
                  <a href={`tel:${coach.contactNumber}`} className="text-brand-orange-500 hover:underline">
                    {coach.contactNumber}
                  </a>
                </dd>
              </div>
              {coach.email && (
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">Email</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right truncate max-w-[160px]" title={coach.email}>
                    {coach.email}
                  </dd>
                </div>
              )}
              {coach.timing && (
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">Timing</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right truncate max-w-[160px]" title={coach.timing}>
                    {coach.timing}
                  </dd>
                </div>
              )}
              {coach.address && (
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">Address</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right truncate max-w-[160px]" title={coach.address}>
                    {coach.address}
                  </dd>
                </div>
              )}
              <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">Joined</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
                  {fmtDate(coach.joinDate)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-400 dark:text-zinc-500 shrink-0">Salary</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100 text-right">
                  {INR(coach.fixedSalary)} / mo
                </dd>
              </div>
            </dl>
          </div>

          {/* Coach Notes */}
          {coach.notes && (
            <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Notes</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">{coach.notes}</p>
            </div>
          )}

          {/* Personal Training Plans (Coach Only) */}
          {coach.role === "COACH" && (
            <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Personal Training ({activeStudentCount} active)
              </h3>
              {coach.studentPlans.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-2">
                  No personal training plans assigned yet.
                </p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {coach.studentPlans.map((plan) => (
                    <div key={plan.id} className="text-xs border-b border-zinc-50 dark:border-zinc-800/40 pb-2.5 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <Link href={`/admin/students/${plan.student.id}`} className="font-bold text-zinc-800 dark:text-zinc-200 hover:text-brand-orange-500 truncate transition-colors">
                          {plan.student.name}
                        </Link>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${plan.isActive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-zinc-50 text-zinc-400 dark:bg-zinc-800"}`}>
                          {plan.isActive ? "Active" : "Completed"}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                        TAG {plan.student.studentNumber} · {plan.planMonths} mo · {INR(plan.fee)}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {fmtDate(plan.startDate)} → {fmtDate(plan.endDate)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right Column: Multi-Month Calendar View + Revenue Share Card ── */}
        <div className="space-y-4 min-w-0">
          {/* Card 1: Horizontal Scrollable Multi-Month Calendar (Identical to Student Profile) */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Attendance &amp; Schedule
              </h2>
              {attendanceLogsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowLogs(!showLogs)}
                  className="text-xs font-semibold text-brand-orange-500 hover:text-brand-orange-600 transition-colors cursor-pointer"
                >
                  {showLogs ? "Hide logs" : "Show logs"}
                </button>
              )}
            </div>

            <div className={showLogs ? "grid gap-6 lg:grid-cols-[1fr_260px]" : "w-full"}>
              {/* Scrollable multi-month grid */}
              <div className="flex flex-col min-w-0 justify-between">
                <div ref={scrollContainerRef} className="flex gap-6 overflow-x-auto px-2 pb-4 scrollbar-thin snap-x">
                  {calendarMonths.map(({ year: calYear, month: calMonthZeroIndexed }) => {
                    const calMonthLabel = new Date(calYear, calMonthZeroIndexed, 1).toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                    });
                    const firstDay = new Date(calYear, calMonthZeroIndexed, 1).getDay(); // 0 = Sun
                    const daysInMonth = new Date(calYear, calMonthZeroIndexed + 1, 0).getDate();
                    const cells = [
                      ...Array(firstDay).fill(null),
                      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
                    ];

                    return (
                      <div key={`${calYear}-${calMonthZeroIndexed}`} className="w-[260px] shrink-0 snap-start">
                        <div className="text-center pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            {calMonthLabel}
                          </span>
                        </div>

                        <div className="grid grid-cols-7 text-center text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase pb-1">
                          {WEEKDAY_LABELS.map((d) => (
                            <span key={d}>{d}</span>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {cells.map((day, idx) => {
                            if (!day) return <div key={`empty-${idx}`} />;
                            const dayStr = String(day).padStart(2, "0");
                            const monthStr = String(calMonthZeroIndexed + 1).padStart(2, "0");
                            const dateKey = `${calYear}-${monthStr}-${dayStr}`;

                            const isPresent = attendance[dateKey] === "PRESENT";
                            const isAbsent = attendance[dateKey] === "ABSENT";
                            const isToday = dateKey === todayStr;
                            const isFuture = dateKey > todayStr;
                            const isSunday = new Date(calYear, calMonthZeroIndexed, day).getDay() === 0;

                            const cellKey = `${coach.id}-${dateKey}`;
                            const isUpdating = updatingCells[cellKey];

                            let cellStyle = "text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer";
                            let cellContent = <span className="leading-none">{day}</span>;

                            if (isUpdating) {
                              cellContent = <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />;
                              cellStyle = "bg-zinc-50 dark:bg-zinc-800 cursor-wait";
                            } else if (isPresent) {
                              cellContent = (
                                <div className="flex flex-col items-center justify-center leading-none">
                                  <Check className="h-3 w-3 stroke-[3]" />
                                  <span className="text-[7px] font-semibold mt-0.5">{day}</span>
                                </div>
                              );
                              cellStyle = "bg-emerald-500 text-white font-bold shadow-xs";
                            } else if (isAbsent) {
                              cellContent = (
                                <div className="flex flex-col items-center justify-center leading-none">
                                  <X className="h-3 w-3 stroke-[3]" />
                                  <span className="text-[7px] font-semibold mt-0.5">{day}</span>
                                </div>
                              );
                              cellStyle = "bg-rose-500 text-white font-bold shadow-xs";
                            } else if (isFuture || isSunday) {
                              cellStyle = "text-zinc-300 dark:text-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/10 cursor-default opacity-40";
                            }

                            return (
                              <button
                                key={dateKey}
                                disabled={isFuture || isSunday}
                                onClick={() => {
                                  const dayStr = String(day).padStart(2, "0");
                                  const monthStr = String(calMonthZeroIndexed + 1).padStart(2, "0");
                                  const cellDateStr = `${calYear}-${monthStr}-${dayStr}`;
                                  setActiveMarkDate({
                                    year: calYear,
                                    monthZeroIndex: calMonthZeroIndexed,
                                    day,
                                    dateStr: cellDateStr,
                                  });
                                }}
                                className={`flex flex-col items-center justify-center h-8 rounded-lg text-[10px] transition-colors relative outline-none select-none ${cellStyle} ${
                                  isToday && !isPresent && !isAbsent ? "ring-2 ring-zinc-950 dark:ring-zinc-100 ring-offset-1 dark:ring-offset-zinc-900" : ""
                                }`}
                                title={isFuture ? "Future Date" : isSunday ? "Sunday" : `Day ${day}: ${attendance[dateKey] || "Unmarked"}`}
                              >
                                {cellContent}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-zinc-100 dark:border-zinc-800 mt-2 pt-3 text-[10px] text-zinc-400 dark:text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded bg-emerald-500" />
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded bg-rose-500" />
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-800/40" />
                    <span>Sundays</span>
                  </div>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 italic ml-auto">
                    Click cells to cycle: Unmarked → Present → Absent
                  </span>
                </div>
              </div>

              {/* Attendance Log List Sidebar */}
              {showLogs && (
                <div className="flex flex-col min-w-0 lg:border-l lg:border-zinc-100 lg:dark:border-zinc-800 lg:pl-6">
                  <div className="space-y-1.5 overflow-y-auto max-h-[300px] pr-1">
                    {attendanceLogsList.length === 0 ? (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 py-10 text-center">
                        No sessions logged yet.
                      </p>
                    ) : (
                      attendanceLogsList.map((log, idx) => {
                        const dateObj = new Date(log.dateStr + "T00:00:00.000Z");
                        const displayDate = dateObj.toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "UTC",
                        });

                        const isPresent = log.status === "PRESENT";

                        return (
                          <div
                            key={log.dateStr}
                            className="flex items-center gap-3 rounded-2xl px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                          >
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0 text-white ${isPresent ? "bg-emerald-500" : "bg-rose-500"}`}>
                              {isPresent ? "P" : "A"}
                            </span>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                                {isPresent ? "Present" : "Absent"}
                              </p>
                              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                {displayDate}
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

          {/* Calculations list grouped by month */}
          <div className="space-y-4">
            {paymentMonths.map((monthVal) => {
              const monthLabel = new Date(monthVal.year, monthVal.month, 1).toLocaleString("en-IN", {
                month: "long",
                year: "numeric",
              });

              const filteredEarningsForMonth = earningsRows.filter((r) =>
                r.months.some((m) => m.year === monthVal.year && m.month === monthVal.month + 1)
              );

              const multiplier = getMonthSalaryMultiplier(
                coach.joinDate,
                coach.leftDate ?? null,
                monthVal.year,
                monthVal.month + 1
              );

              const proRatedFixedSalary = Math.round(coach.fixedSalary * multiplier);

              const proRatedRevenue = filteredEarningsForMonth.reduce((sum, r) => {
                const mData = r.months.find((m) => m.year === monthVal.year && m.month === monthVal.month + 1);
                const personalCoachFee = mData?.amount ?? 0;
                return sum + Math.round(personalCoachFee * multiplier);
              }, 0);

              const daysInMonth = new Date(monthVal.year, monthVal.month + 1, 0).getDate();
              let sundaysCount = 0;
              for (let d = 1; d <= daysInMonth; d++) {
                if (new Date(monthVal.year, monthVal.month, d).getDay() === 0) {
                  sundaysCount++;
                }
              }
              const workingDays = daysInMonth - sundaysCount;
              const absentDays = Object.entries(attendance).filter(([dateStr, status]) => {
                if (status !== "ABSENT") return false;
                const [y, m] = dateStr.split("-").map(Number);
                return y === monthVal.year && m === monthVal.month + 1;
              }).length;

              const deduction = workingDays > 0 ? Math.round((proRatedFixedSalary / workingDays) * absentDays) : 0;
              const totalPay = Math.max(0, proRatedFixedSalary - deduction) + proRatedRevenue;

              const paymentKey = `${monthVal.year}-${monthVal.month + 1}`;
              const currentPayment = paymentsState[paymentKey] || { paid: false, loading: false };
              const dbPayment = coach.salaryPayments?.find(
                (p) => p.year === monthVal.year && p.month === monthVal.month + 1
              );

              return (
                <div key={paymentKey} className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
                  {/* Month Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40">
                    <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex flex-wrap items-center gap-1.5">
                      <span>{monthLabel}</span>
                      {currentPayment.paid && (
                        <span className="normal-case font-normal text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0">
                          · Paid {dbPayment?.paidAt ? new Date(dbPayment.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "today"}
                        </span>
                      )}
                    </h2>
                    <div className="flex items-center gap-2">
                      {/* Printable Link */}
                      <Link
                        href={`/admin/coaches/${coach.id}/salary-slip/${monthVal.year}/${monthVal.month + 1}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold border bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer select-none"
                      >
                        <Printer className="h-3.5 w-3.5 text-zinc-450 dark:text-zinc-400" />
                        Slip
                      </Link>

                      {/* Paid / Unpaid Toggle */}
                      <button
                        onClick={() => handleTogglePayment(monthVal.year, monthVal.month + 1, totalPay)}
                        disabled={currentPayment.loading}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold border transition-all cursor-pointer select-none ${
                          currentPayment.paid
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            : "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-950/30"
                        }`}
                        title={currentPayment.paid ? "Click to mark as Unpaid" : "Click to mark as Paid"}
                      >
                        {currentPayment.loading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <span className={`h-1.5 w-1.5 rounded-full ${currentPayment.paid ? "bg-emerald-500" : "bg-rose-500"}`} />
                        )}
                        {currentPayment.paid ? "Paid" : "Unpaid"}
                      </button>
                    </div>
                  </div>

                  {/* Line items */}
                  <div className="px-4 py-3 space-y-3 text-sm">
                    {/* Fixed Pay */}
                    <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        Fixed Pay {multiplier < 1 && <span className="text-[10px] text-zinc-450 dark:text-zinc-450 font-normal italic">(pro-rated)</span>}
                      </span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {INR(proRatedFixedSalary)}
                      </span>
                    </div>

                    {deduction > 0 && (
                      <div className="flex justify-between items-center text-rose-500 dark:text-rose-400 text-xs pl-2">
                        <span className="font-medium">
                          Deduction ({absentDays} absent day{absentDays > 1 ? "s" : ""} of {workingDays} working days)
                        </span>
                        <span className="font-semibold">
                          -{INR(deduction)}
                        </span>
                      </div>
                    )}

                    {/* 1-to-1 Students calculations */}
                    {loadingEarnings ? (
                      <div className="h-6 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg" />
                    ) : coach.role === "COACH" && filteredEarningsForMonth.length > 0 ? (
                      <div className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                        {filteredEarningsForMonth.map((row) => {
                          const mData = row.months.find((m) => m.year === monthVal.year && m.month === monthVal.month + 1);
                          const studentMonthlyFee = Math.round(row.totalFee / row.planMonths);
                          const personalCoachFee = mData?.amount ?? 0;
                          const proRatedPersonalCoachFee = Math.round(personalCoachFee * multiplier);

                          return (
                            <div key={row.studentPlanId} className="space-y-2">
                              {/* Student Header */}
                              <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                <div className="flex items-center gap-1.5">
                                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-orange-100 dark:bg-brand-orange-950/40 text-brand-orange-600 text-[8px] font-bold">
                                    {row.studentName.charAt(0)}
                                  </span>
                                  <Link href={`/admin/students/${row.studentId}`} className="text-zinc-700 dark:text-zinc-300 hover:text-brand-orange-500 transition-colors">
                                    {row.studentName}
                                  </Link>
                                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">TAG {row.studentNumber}</span>
                                </div>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-250">
                                  {INR(proRatedPersonalCoachFee)}
                                </span>
                              </div>

                              {/* Breakdown Calculation details */}
                              <div className="pl-5 space-y-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                                <div className="flex justify-between">
                                  <span>Total plan fee ({row.planMonths} months)</span>
                                  <span>{INR(row.totalFee)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Monthly share ({INR(row.totalFee)} / {row.planMonths} mo)</span>
                                  <span>{INR(studentMonthlyFee)}</span>
                                </div>
                                <div className="flex justify-between font-medium text-zinc-500 dark:text-zinc-400">
                                  <span>Personal coach fee ({row.commissionPercent || 50}% split)</span>
                                  <span>
                                    {row.commissionPercent || 50}% of {INR(studentMonthlyFee)} = {INR(personalCoachFee)}
                                    {multiplier < 1 && <span className="text-[10px] text-zinc-400 font-normal italic"> (pro-rated to {INR(proRatedPersonalCoachFee)})</span>}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>

                  {/* Total Payout */}
                  <div className="flex justify-between items-center px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Total
                    </span>
                    <span className="text-xl font-bold text-brand-orange-500">
                      {INR(totalPay)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      {editOpen && (
        <CoachFormModal
          existing={coach}
          onClose={() => setEditOpen(false)}
          onSaved={(msg) => {
            showToast("success", msg);
            window.location.reload();
          }}
        />
      )}

      {/* Attendance Picker Modal */}
      {activeMarkDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && !savingModal && setActiveMarkDate(null)}
        >
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl p-6 flex flex-col gap-5 animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Mark Attendance
                </p>
                <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 mt-0.5 truncate" title={formattedModalDate}>
                  {formattedModalDate}
                </h3>
              </div>
              <button
                type="button"
                disabled={savingModal}
                onClick={() => setActiveMarkDate(null)}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={savingModal}
                onClick={() => saveStatus("PRESENT")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 text-sm transition-colors cursor-pointer shadow-sm"
              >
                {savingModal ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Mark as Present
              </button>
              <button
                type="button"
                disabled={savingModal}
                onClick={() => saveStatus("ABSENT")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold py-3 text-sm transition-colors cursor-pointer shadow-sm"
              >
                {savingModal ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Mark as Absent
              </button>
              <button
                type="button"
                disabled={savingModal}
                onClick={() => saveStatus(null)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 text-zinc-700 dark:text-zinc-300 font-semibold py-3 text-sm transition-colors cursor-pointer shadow-xs"
              >
                {savingModal ? <Loader2 className="h-4 w-4 animate-spin text-zinc-500" /> : null}
                Mark as None (Clear)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
