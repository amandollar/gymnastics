import { startOfDay } from "@/lib/plan/calculations";

export type StudentStatus =
  | "ACTIVE"
  | "GRACE"
  | "FREEZE"
  | "INACTIVE"
  | "NO_PLAN";

export interface ActivePlanSnapshot {
  sessionsCompleted: number;
  totalSessions: number;
  /** Last day of the plan window (inclusive). */
  endDate: Date;
  /**
   * Grace-period deadline = endDate + graceDays.
   * Status is GRACE between endDate+1 and expiryDate (inclusive).
   * Status is INACTIVE after expiryDate.
   */
  expiryDate: Date;
  /** When set (and today is within the window), status is FREEZE. */
  freezeStartDate?: Date | null;
  freezeEndDate?: Date | null;
}

export function computeStudentAge(
  dateOfBirth: Date,
  today = new Date()
): number {
  let years = today.getFullYear() - dateOfBirth.getFullYear();
  let months = today.getMonth() - dateOfBirth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (today.getDate() < dateOfBirth.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }
  return years + (months % 12) / 10;
}

export function formatAge(dateOfBirth: Date): string {
  const age = computeStudentAge(dateOfBirth);
  const years = Math.floor(age);
  const months = Math.round((age - years) * 10);
  if (months === 0) return `${years} yrs`;
  return `${years}.${months} yrs`;
}

export function computeTenureMonths(
  admissionDate: Date,
  today = new Date()
): number {
  let months =
    (today.getFullYear() - admissionDate.getFullYear()) * 12 +
    (today.getMonth() - admissionDate.getMonth());
  if (today.getDate() < admissionDate.getDate()) months--;
  return Math.max(0, months);
}

export function formatJoinedDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTenure(admissionDate: Date): string {
  const months = computeTenureMonths(admissionDate);
  if (months < 1) return "Just joined";
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${rem} month${rem !== 1 ? "s" : ""}`;
  if (rem === 0) return `${years} year${years !== 1 ? "s" : ""}`;
  return `${years} year${years !== 1 ? "s" : ""} ${rem} month${rem !== 1 ? "s" : ""}`;
}

/**
 * Computes the student's current plan status.
 *
 * Status priority (highest → lowest):
 * 1. NO_PLAN  — no active plan record
 * 2. INACTIVE — sessions exhausted (sessionsCompleted >= totalSessions)
 * 3. FREEZE   — admin has applied a holiday freeze that covers today
 * 4. INACTIVE — today > expiryDate (grace period also exhausted)
 * 5. GRACE    — today > endDate but today <= expiryDate
 * 6. ACTIVE   — today <= endDate (within plan window)
 *
 * Status is NEVER stored in the database — always computed at query time.
 */
export function computeStudentStatus(
  activePlan: ActivePlanSnapshot | null | undefined
): StudentStatus {
  if (!activePlan) return "NO_PLAN";

  const {
    sessionsCompleted,
    totalSessions,
    endDate,
    expiryDate,
    freezeStartDate,
    freezeEndDate,
  } = activePlan;

  // 1. Sessions exhausted → always INACTIVE regardless of dates
  if (sessionsCompleted >= totalSessions) return "INACTIVE";

  const today = startOfDay(new Date());
  const end = startOfDay(new Date(endDate));
  const expiry = startOfDay(new Date(expiryDate));

  // 2. Check active freeze window
  if (freezeStartDate && freezeEndDate) {
    const fStart = startOfDay(new Date(freezeStartDate));
    const fEnd = startOfDay(new Date(freezeEndDate));
    if (today >= fStart && today <= fEnd) return "FREEZE";
  }

  // 3. Grace period completely exhausted
  if (today > expiry) return "INACTIVE";

  // 4. Within grace window (after end date but before expiry)
  if (today > end) return "GRACE";

  // 5. Still within the active plan window
  return "ACTIVE";
}

export const STATUS_STYLES: Record<
  StudentStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
  },
  GRACE: {
    label: "Grace",
    className: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
  },
  FREEZE: {
    label: "Freeze",
    className: "bg-sky-50 text-sky-800 ring-1 ring-sky-200/80",
  },
  INACTIVE: {
    label: "Inactive",
    className: "bg-orange-50 text-orange-800 ring-1 ring-orange-200/80",
  },
  NO_PLAN: {
    label: "No plan",
    className: "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/80",
  },
};

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateInput(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}
