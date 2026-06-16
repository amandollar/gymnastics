// ─── Shared Types & Helpers for Student Profile ──────────────────────────────

export type FreezePeriod = {
  id: string;
  startDate: Date;
  endDate: Date;
};

export type PlanRow = {
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
  freezePeriods?: FreezePeriod[];
  batch?: { id: string; name: string; timing: string; activeCount?: number; graceCount?: number; inactiveCount?: number; studentCount?: number } | null;
};

export type AttendanceRow = {
  id: string;
  date: Date;
  studentPlanId: string;
};

/** Returns YYYY-MM-DD string for a date (no timezone shift) */
export function toYMD(date: Date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getFreezeDaysCount(start: Date | string, end: Date | string) {
  const s = new Date(start);
  const e = new Date(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  const diffTime = e.getTime() - s.getTime();
  if (diffTime < 0) return 0;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function formatSessionDate(date: Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
