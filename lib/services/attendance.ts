import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DayAttendanceCount = {
  date: string; // "YYYY-MM-DD"
  count: number;
};

export type PresentStudent = {
  id: string;
  studentNumber: number;
  name: string;
  avatarUrl: string | null;
  gender: string;
  planName: string | null;
  planType: string | null;
  attendanceId: string;
};

export type AttendanceKpis = {
  /** Students who attended today (present count only) */
  todayCount: number;
  /** Students whose admissionDate is in this month */
  newStudentsThisMonth: number;
  /** Students who got a new plan this month but had a prior plan */
  renewalsThisMonth: number;
  /** Average daily present count across days with attendance this month */
  avgDailyAttendance: number;
  /** Total attendance records (sessions) logged this month */
  totalSessionsThisMonth: number;
};

export type MonthlyBreakdown = {
  /** New admissions in the month */
  newAdmissions: number;
  /** Renewals in the month */
  renewals: number;
  /** Total attendance records in the month */
  totalSessions: number;
  /** Distinct days that had at least one attendance record */
  activeDays: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns UTC midnight boundaries for the given calendar month (year/month 1-indexed) */
function monthBounds(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

/** Formats a Date to "YYYY-MM-DD" in UTC */
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns a count of present students for every day in the given month.
 * Only days that have at least one attendance record appear in the result.
 */
export async function getMonthlyAttendanceCounts(
  year: number,
  month: number
): Promise<DayAttendanceCount[]> {
  const { start, end } = monthBounds(year, month);

  // Prisma `groupBy` on a Date field — we cast to string in-memory because
  // Prisma returns the raw Date object and doesn't support date-only group-by
  // across all drivers without raw SQL.
  const records = await prisma.attendance.findMany({
    where: { date: { gte: start, lte: end } },
    select: { date: true },
    orderBy: { date: "asc" },
  });

  // Aggregate client-side (array is small — max ~31 days × ~300 students)
  const countMap = new Map<string, number>();
  for (const r of records) {
    const key = toDateStr(r.date);
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }

  return Array.from(countMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));
}

/**
 * Returns all students who are marked present on the given date.
 * date must be "YYYY-MM-DD"
 */
export async function getPresentStudentsOnDate(
  dateStr: string
): Promise<PresentStudent[]> {
  // Attendance.date is stored as @db.Date (date-only, UTC midnight)
  const date = new Date(dateStr + "T00:00:00.000Z");

  const records = await prisma.attendance.findMany({
    where: { date },
    select: {
      id: true,
      student: {
        select: {
          id: true,
          studentNumber: true,
          name: true,
          avatarUrl: true,
          gender: true,
        },
      },
      studentPlan: {
        select: {
          planType: true,
        },
      },
    },
    orderBy: { student: { studentNumber: "asc" } },
  });

  return records.map((r) => ({
    id: r.student.id,
    studentNumber: r.student.studentNumber,
    name: r.student.name,
    avatarUrl: r.student.avatarUrl,
    gender: r.student.gender,
    // PlanTemplate name is not directly on StudentPlan — use planType as label
    planName: r.studentPlan?.planType === "ONE_TO_ONE" ? "Personal training" : "Group class",
    planType: r.studentPlan?.planType ?? null,
    attendanceId: r.id,
  }));
}

/**
 * Returns KPI stats for the given month.
 * - todayCount: present students today
 * - newStudentsThisMonth: students with admissionDate in this month
 * - renewalsThisMonth: students who got a new plan this month AND had a prior plan
 * - avgDailyAttendance: mean daily present count for days that had attendance
 * - totalSessionsThisMonth: total attendance records this month
 */
export async function getAttendanceKpis(
  year: number,
  month: number
): Promise<AttendanceKpis> {
  const { start, end } = monthBounds(year, month);
  const todayStr = toLocalDateStr(new Date());
  const todayDate = new Date(todayStr + "T00:00:00.000Z");

  const [
    todayCount,
    monthlyRecords,
    newStudents,
    renewalPlans,
  ] = await Promise.all([
    // Today's present count
    prisma.attendance.count({ where: { date: todayDate } }),

    // All attendance records this month (for avg + total)
    prisma.attendance.findMany({
      where: { date: { gte: start, lte: end } },
      select: { date: true },
    }),

    // New admissions: admissionDate in this month
    prisma.student.count({
      where: { admissionDate: { gte: start, lte: end } },
    }),

    // Plans started this month — then filter for renewals in-memory
    prisma.studentPlan.findMany({
      where: { startDate: { gte: start, lte: end } },
      select: {
        studentId: true,
        startDate: true,
        student: {
          select: {
            plans: {
              where: { startDate: { lt: start } },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    }),
  ]);

  // Count renewals: student has at least one previous plan before this month
  const renewalsThisMonth = renewalPlans.filter(
    (p) => p.student.plans.length > 0
  ).length;

  // Avg daily attendance
  const countMap = new Map<string, number>();
  for (const r of monthlyRecords) {
    const key = toDateStr(r.date);
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }
  const activeDays = countMap.size;
  const totalSessionsThisMonth = monthlyRecords.length;
  const avgDailyAttendance =
    activeDays > 0 ? Math.round(totalSessionsThisMonth / activeDays) : 0;

  return {
    todayCount,
    newStudentsThisMonth: newStudents,
    renewalsThisMonth,
    avgDailyAttendance,
    totalSessionsThisMonth,
  };
}

/**
 * Returns a month-by-month breakdown array for the given year.
 * Used to populate the "year overview" chart / month picker.
 */
export async function getYearlyMonthlyBreakdown(
  year: number
): Promise<(MonthlyBreakdown & { month: number })[]> {
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

  const [allAttendances, allNewStudents, allNewPlans] = await Promise.all([
    prisma.attendance.findMany({
      where: { date: { gte: yearStart, lte: yearEnd } },
      select: { date: true },
    }),
    prisma.student.findMany({
      where: { admissionDate: { gte: yearStart, lte: yearEnd } },
      select: { admissionDate: true },
    }),
    prisma.studentPlan.findMany({
      where: { startDate: { gte: yearStart, lte: yearEnd } },
      select: {
        startDate: true,
        studentId: true,
        student: {
          select: {
            plans: {
              where: { startDate: { lt: yearStart } },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    }),
  ]);

  const result: (MonthlyBreakdown & { month: number })[] = [];

  for (let m = 1; m <= 12; m++) {
    const { start, end } = monthBounds(year, m);

    const monthAttendances = allAttendances.filter((a) => {
      const d = a.date;
      return d >= start && d <= end;
    });
    const daySet = new Set(monthAttendances.map((a) => toDateStr(a.date)));

    const newAdmissions = allNewStudents.filter((s) => {
      const d = s.admissionDate;
      return d >= start && d <= end;
    }).length;

    const renewals = allNewPlans.filter((p) => {
      const d = p.startDate;
      return d >= start && d <= end && p.student.plans.length > 0;
    }).length;

    result.push({
      month: m,
      newAdmissions,
      renewals,
      totalSessions: monthAttendances.length,
      activeDays: daySet.size,
    });
  }

  return result;
}

/**
 * ── THE MAIN QUERY ──
 * Fetches ALL data needed for the attendance page in a single month in one
 * batched Promise.all (4 DB queries total). The result is keyed by date so
 * the client can switch between dates with zero network calls.
 */
export async function getMonthlyAttendanceData(
  year: number,
  month: number
): Promise<{
  /** All present students grouped by "YYYY-MM-DD" */
  rollCallByDate: Record<string, PresentStudent[]>;
  /** New admissions (registrations) grouped by "YYYY-MM-DD" */
  registrationsByDate: Record<string, PresentStudent[]>;
  /** Renewals grouped by "YYYY-MM-DD" */
  renewalsByDate: Record<string, PresentStudent[]>;
  /** Daily attendance counts (only days with data) */
  calendarCounts: DayAttendanceCount[];
  /** KPIs for this month */
  kpis: AttendanceKpis;
}> {
  const { start, end } = monthBounds(year, month);
  const todayStr = toLocalDateStr(new Date());
  const todayDate = new Date(todayStr + "T00:00:00.000Z");

  // ── 4 queries, all in parallel ─────────────────────────────────────────────
  const [allAttendances, todayCount, newStudents, renewalPlans] =
    await Promise.all([
      // 1. ALL attendance records for the month — with student + plan data
      prisma.attendance.findMany({
        where: { date: { gte: start, lte: end } },
        select: {
          id: true,
          date: true,
          student: {
            select: {
              id: true,
              studentNumber: true,
              name: true,
              avatarUrl: true,
              gender: true,
            },
          },
          studentPlan: {
            select: { planType: true },
          },
        },
        orderBy: [{ date: "asc" }, { student: { studentNumber: "asc" } }],
      }),

      // 2. Today's present count (always current day, regardless of viewed month)
      prisma.attendance.count({ where: { date: todayDate } }),

      // 3. New admissions this month (by admissionDate)
      prisma.student.findMany({
        where: { admissionDate: { gte: start, lte: end } },
        select: {
          id: true,
          studentNumber: true,
          name: true,
          avatarUrl: true,
          gender: true,
          admissionDate: true,
          plans: {
            select: {
              planType: true,
            },
            take: 1,
          },
        },
        orderBy: { studentNumber: "asc" },
      }),

      // 4. Plans started this month — filter renewals in-memory
      prisma.studentPlan.findMany({
        where: { startDate: { gte: start, lte: end } },
        select: {
          id: true,
          startDate: true,
          planType: true,
          student: {
            select: {
              id: true,
              studentNumber: true,
              name: true,
              avatarUrl: true,
              gender: true,
              plans: {
                select: { id: true, startDate: true },
              },
            },
          },
        },
        orderBy: { student: { studentNumber: "asc" } },
      }),
    ]);

  // ── Build rollCallByDate and countMap from query #1 ───────────────────────
  const rollCallByDate: Record<string, PresentStudent[]> = {};
  const countMap = new Map<string, number>();

  for (const r of allAttendances) {
    const dateStr = toDateStr(r.date);

    // Calendar count
    countMap.set(dateStr, (countMap.get(dateStr) ?? 0) + 1);

    // Roll call
    if (!rollCallByDate[dateStr]) rollCallByDate[dateStr] = [];
    rollCallByDate[dateStr].push({
      id: r.student.id,
      studentNumber: r.student.studentNumber,
      name: r.student.name,
      avatarUrl: r.student.avatarUrl,
      gender: r.student.gender,
      planName:
        r.studentPlan?.planType === "ONE_TO_ONE"
          ? "Personal training"
          : "Group class",
      planType: r.studentPlan?.planType ?? null,
      attendanceId: r.id,
    });
  }

  // ── Group new admissions by day ──────────────────────────────────────────
  const registrationsByDate: Record<string, PresentStudent[]> = {};
  for (const s of newStudents) {
    const dateStr = toLocalDateStr(s.admissionDate);
    if (!registrationsByDate[dateStr]) registrationsByDate[dateStr] = [];
    
    const plan = s.plans[0];
    registrationsByDate[dateStr].push({
      id: s.id,
      studentNumber: s.studentNumber,
      name: s.name,
      avatarUrl: s.avatarUrl,
      gender: s.gender,
      planName: plan
        ? plan.planType === "ONE_TO_ONE"
          ? "Personal training"
          : "Group class"
        : null,
      planType: plan ? plan.planType : null,
      attendanceId: s.id,
    });
  }

  // ── Filter and group renewals by day ─────────────────────────────────────
  const renewalsByDate: Record<string, PresentStudent[]> = {};
  let renewalsCount = 0;
  for (const sp of renewalPlans) {
    const isRenewal = sp.student.plans.some(
      (p) => p.startDate.getTime() < sp.startDate.getTime()
    );
    if (!isRenewal) continue;

    renewalsCount++;
    const dateStr = toLocalDateStr(sp.startDate);
    if (!renewalsByDate[dateStr]) renewalsByDate[dateStr] = [];
    
    renewalsByDate[dateStr].push({
      id: sp.student.id,
      studentNumber: sp.student.studentNumber,
      name: sp.student.name,
      avatarUrl: sp.student.avatarUrl,
      gender: sp.student.gender,
      planName: sp.planType === "ONE_TO_ONE" ? "Personal training" : "Group class",
      planType: sp.planType,
      attendanceId: sp.id,
    });
  }

  const calendarCounts: DayAttendanceCount[] = Array.from(
    countMap.entries()
  ).map(([date, count]) => ({ date, count }));

  // ── Compute KPIs ──────────────────────────────────────────────────────────
  const totalSessionsThisMonth = allAttendances.length;
  const activeDays = countMap.size;
  const avgDailyAttendance =
    activeDays > 0 ? Math.round(totalSessionsThisMonth / activeDays) : 0;

  const kpis: AttendanceKpis = {
    todayCount,
    newStudentsThisMonth: newStudents.length,
    renewalsThisMonth: renewalsCount,
    avgDailyAttendance,
    totalSessionsThisMonth,
  };

  return { rollCallByDate, registrationsByDate, renewalsByDate, calendarCounts, kpis };
}
