import { prisma } from "@/lib/prisma";
import type { CoachStatus, CoachAttendanceStatus, CoachRole } from "@prisma/client";
import { uploadCoachAvatarToCloudinary } from "@/lib/avatar/cloudinary";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CoachWithStats {
  id: string;
  name: string;
  contactNumber: string;
  email: string | null;
  joinDate: Date;
  timing: string | null;
  specialization: string | null;
  fixedSalary: number;
  status: CoachStatus;
  role: CoachRole;
  notes: string | null;
  address: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  commissionPercent: number;
  /** Attendance records for the queried date range */
  todayAttendance?: { status: CoachAttendanceStatus } | null;
  /** Count of active ONE_TO_ONE plans assigned to this coach */
  activeStudentCount: number;
}

export interface CoachMonthlyEarningRow {
  studentPlanId: string;
  studentId: string;
  studentName: string;
  studentNumber: number;
  planStartDate: Date;
  planEndDate: Date;
  totalFee: number;
  coachShare: number;       // commissionPercent of totalFee
  planMonths: number;       // duration of plan in months
  monthlyAmount: number;    // coachShare / planMonths
  commissionPercent: number; // custom share percentage
  /** Which months this plan spans (within planStart–planEnd) */
  months: { year: number; month: number; label: string; amount: number }[];
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listCoaches(options?: {
  status?: CoachStatus | "ALL";
  dateStr?: string; // "YYYY-MM-DD" — load today's attendance for each coach
  role?: CoachRole;
}): Promise<CoachWithStats[]> {
  const whereClause: any = {};
  if (options?.status && options.status !== "ALL") {
    whereClause.status = options.status;
  }
  if (options?.role) {
    whereClause.role = options.role;
  }

  const coaches = await (prisma as any).coach.findMany({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    include: {
      attendances: options?.dateStr
        ? {
            where: {
              date: new Date(options.dateStr + "T00:00:00.000Z"),
            },
            take: 1,
          }
        : false,
      studentPlans: {
        where: { isActive: true, planType: "ONE_TO_ONE" },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return coaches.map((c: any) => ({
    ...c,
    todayAttendance: c.attendances?.[0] ?? null,
    activeStudentCount: (c.studentPlans as any[]).length,
  }));
}

// ─── Get by ID ────────────────────────────────────────────────────────────────

export async function getCoachById(id: string) {
  const coach = await (prisma as any).coach.findUnique({
    where: { id },
    include: {
      attendances: {
        orderBy: { date: "desc" },
        take: 200, // last 200 days of attendance history
      },
      studentPlans: {
        where: { planType: "ONE_TO_ONE" },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              studentNumber: true,
            },
          },
        },
        orderBy: { startDate: "desc" },
      },
      salaryPayments: true,
    },
  });
  return coach ?? null;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createCoach(data: {
  name: string;
  contactNumber: string;
  email?: string;
  joinDate: Date;
  timing?: string;
  specialization?: string;
  fixedSalary?: number;
  role?: CoachRole;
  notes?: string;
  address?: string;
  avatarFile?: File | null;
}) {
  const coach = await (prisma as any).coach.create({
    data: {
      name: data.name,
      contactNumber: data.contactNumber,
      email: data.email || null,
      joinDate: data.joinDate,
      timing: data.timing || null,
      specialization: data.specialization || null,
      fixedSalary: data.fixedSalary ?? 0,
      notes: data.notes || null,
      address: data.address || null,
      avatarUrl: null,
      status: "WORKING",
      role: data.role ?? "COACH",
    },
  });

  if (data.avatarFile && data.avatarFile.size > 0) {
    const uploadedUrl = await uploadCoachAvatarToCloudinary(coach.id, data.avatarFile);
    return (prisma as any).coach.update({
      where: { id: coach.id },
      data: { avatarUrl: uploadedUrl },
    });
  }

  return coach;
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateCoach(
  id: string,
  data: {
    name?: string;
    contactNumber?: string;
    email?: string | null;
    joinDate?: Date;
    timing?: string | null;
    specialization?: string | null;
    fixedSalary?: number;
    status?: CoachStatus;
    role?: CoachRole;
    notes?: string | null;
    address?: string | null;
    avatarFile?: File | null;
  }
) {
  const { avatarFile, ...rest } = data;

  let uploadedUrl: string | null = null;
  if (avatarFile && avatarFile.size > 0) {
    uploadedUrl = await uploadCoachAvatarToCloudinary(id, avatarFile);
  }

  return (prisma as any).coach.update({
    where: { id },
    data: {
      ...rest,
      ...(uploadedUrl ? { avatarUrl: uploadedUrl } : {}),
    },
  });
}

// ─── Attendance ───────────────────────────────────────────────────────────────

/**
 * Upsert a coach attendance record for a given date.
 * If a record already exists for that coach+date, it is updated.
 */
export async function markCoachAttendance(
  coachId: string,
  dateStr: string, // "YYYY-MM-DD"
  status: CoachAttendanceStatus
) {
  const date = new Date(dateStr + "T00:00:00.000Z");
  return (prisma as any).coachAttendance.upsert({
    where: {
      coachId_date: { coachId, date },
    },
    update: { status },
    create: { coachId, date, status },
  });
}

export async function deleteCoachAttendance(
  coachId: string,
  dateStr: string
) {
  const date = new Date(dateStr + "T00:00:00.000Z");
  return (prisma as any).coachAttendance.deleteMany({
    where: { coachId, date },
  });
}

/**
 * Get attendance for all coaches for a given month (year, month 1-indexed).
 * Returns a map of coachId → Map<dateStr, status>.
 */
export async function getCoachMonthlyAttendance(
  year: number,
  month: number
): Promise<Map<string, Map<string, CoachAttendanceStatus>>> {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const records = await (prisma as any).coachAttendance.findMany({
    where: {
      date: { gte: start, lt: end },
    },
    select: { coachId: true, date: true, status: true },
  });

  const map = new Map<string, Map<string, CoachAttendanceStatus>>();
  for (const r of records) {
    if (!map.has(r.coachId)) map.set(r.coachId, new Map());
    const dateStr = new Date(r.date).toISOString().split("T")[0];
    map.get(r.coachId)!.set(dateStr, r.status);
  }
  return map;
}

export async function getCoachMonthlyAttendanceSerializable(
  year: number,
  month: number
): Promise<Record<string, Record<string, CoachAttendanceStatus>>> {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const records = await (prisma as any).coachAttendance.findMany({
    where: {
      date: { gte: start, lt: end },
    },
    select: { coachId: true, date: true, status: true },
  });

  const obj: Record<string, Record<string, CoachAttendanceStatus>> = {};
  for (const r of records) {
    if (!obj[r.coachId]) obj[r.coachId] = {};
    const dateStr = new Date(r.date).toISOString().split("T")[0];
    obj[r.coachId][dateStr] = r.status;
  }
  return obj;
}

// ─── Earnings ─────────────────────────────────────────────────────────────────

/**
 * For a given coach, return all ONE_TO_ONE plans assigned to them,
 * with month-wise earnings breakdown.
 *
 * Earnings rule:
 *   coachShare = 50% of plan fee
 *   monthlyAmount = coachShare / planMonths
 */
export async function getCoachEarnings(
  coachId: string
): Promise<CoachMonthlyEarningRow[]> {
  const plans = await (prisma as any).studentPlan.findMany({
    where: {
      coachId,
      planType: "ONE_TO_ONE",
    },
    include: {
      student: {
        select: { id: true, name: true, studentNumber: true },
      },
    },
    orderBy: { startDate: "desc" },
  });

  return plans.map((plan: any) => {
    const commissionPercent = plan.commissionPercent ?? 50;
    const commissionMultiplier = commissionPercent / 100;
    const totalFee: number = plan.fee;
    const coachShare = Math.round(totalFee * commissionMultiplier);
    const planMonths: number = plan.planMonths ?? 1;
    const monthlyAmount = planMonths > 0 ? Math.round(coachShare / planMonths) : coachShare;

    // Build month-wise breakdown: each calendar month within startDate→endDate
    const months: CoachMonthlyEarningRow["months"] = [];
    const start = new Date(plan.startDate);
    const end = new Date(plan.endDate);

    let cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    const endMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

    while (cur <= endMonth) {
      months.push({
        year: cur.getUTCFullYear(),
        month: cur.getUTCMonth() + 1,
        label: cur.toLocaleString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }),
        amount: monthlyAmount,
      });
      cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));
    }

    return {
      studentPlanId: plan.id,
      studentId: plan.student.id,
      studentName: plan.student.name,
      studentNumber: plan.student.studentNumber,
      planStartDate: plan.startDate,
      planEndDate: plan.endDate,
      totalFee,
      coachShare,
      planMonths,
      monthlyAmount,
      commissionPercent,
      months,
    } satisfies CoachMonthlyEarningRow;
  });
}

export async function toggleCoachSalaryPayment(
  coachId: string,
  year: number,
  month: number,
  paid: boolean,
  amount: number
) {
  return (prisma as any).coachSalaryPayment.upsert({
    where: {
      coachId_year_month: { coachId, year, month },
    },
    update: {
      paid,
      amount,
      paidAt: paid ? new Date() : null,
    },
    create: {
      coachId,
      year,
      month,
      amount,
      paid,
      paidAt: paid ? new Date() : null,
    },
  });
}
