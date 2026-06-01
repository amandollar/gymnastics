import { computeDaysLeft } from "@/lib/plan/calculations";

export type StudentStatus =
  | "ACTIVE"
  | "GRACE"
  | "FREEZE"
  | "INACTIVE"
  | "NO_PLAN";

export interface ActivePlanSnapshot {
  sessionsCompleted: number;
  totalSessions: number;
  expiryDate: Date;
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

export function formatTenure(admissionDate: Date): string {
  return `${computeTenureMonths(admissionDate)} Months`;
}

/** Status logic from plan.md (master) — never stored in DB */
export function computeStudentStatus(
  activePlan: ActivePlanSnapshot | null | undefined
): StudentStatus {
  if (!activePlan) return "NO_PLAN";

  const { sessionsCompleted, totalSessions, expiryDate } = activePlan;
  if (sessionsCompleted >= totalSessions) return "INACTIVE";

  const daysLeft = computeDaysLeft(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (expiry < today) return "FREEZE";
  if (daysLeft <= 7) return "GRACE";
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
