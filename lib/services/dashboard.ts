import { prisma } from "@/lib/prisma";
import { computeStudentStatus } from "@/lib/utils/student";

export type DashboardKpis = {
  activeStudents: number;
  gracePeriodStudents: number;
  freezeStudents: number;
  admissionsThisMonth: number;
  todayAttendanceCount: number;
  monthlyRevenue: number;
};

export type ChartDataPoint = {
  label: string;
  value: number;
};

export type DashboardData = {
  kpis: DashboardKpis;
  attendanceDaily: { day: string; present: number }[];
  attendanceWeekly: { day: string; present: number }[];
  attendanceMonthly: { month: string; present: number }[];
  admissionsDaily: { day: string; admissions: number }[];
  admissionsMonthly: { month: string; admissions: number }[];
  renewalsDaily: { day: string; renewals: number }[];
  renewalsMonthly: { month: string; renewals: number }[];
  revenueMonthly: { month: string; revenue: number }[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Month boundaries in UTC
  const startOfCurMonth = new Date(Date.UTC(currentYear, currentMonth, 1));
  const endOfCurMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));

  // Today boundaries
  const todayStr = now.toISOString().slice(0, 10);
  const todayDate = new Date(todayStr + "T00:00:00.000Z");

  // Parallel database fetch for KPI indicators
  const [
    students,
    admissionsThisMonthCount,
    todayAttendanceCount,
    revenuePlanSum,
  ] = await Promise.all([
    prisma.student.findMany({
      select: {
        id: true,
        plans: {
          where: { isActive: true },
          take: 1,
          select: {
            sessionsCompleted: true,
            totalSessions: true,
            endDate: true,
            expiryDate: true,
            freezeStartDate: true,
            freezeEndDate: true,
            freezePeriods: {
              select: {
                startDate: true,
                endDate: true,
              },
            },
          },
        },
      },
    }),
    prisma.student.count({
      where: { admissionDate: { gte: startOfCurMonth, lte: endOfCurMonth } },
    }),
    prisma.attendance.count({
      where: { date: todayDate },
    }),
    prisma.studentPlan.aggregate({
      where: { startDate: { gte: startOfCurMonth, lte: endOfCurMonth } },
      _sum: { fee: true },
    }),
  ]);

  // Compute active vs grace vs freeze count in-memory
  let activeStudents = 0;
  let gracePeriodStudents = 0;
  let freezeStudents = 0;
  for (const s of students) {
    const activePlan = s.plans[0];
    const status = computeStudentStatus(activePlan);
    if (status === "ACTIVE") activeStudents++;
    else if (status === "GRACE") gracePeriodStudents++;
    else if (status === "FREEZE") freezeStudents++;
  }

  const monthlyRevenue = revenuePlanSum._sum.fee ?? 0;

  // ─── Chart ranges calculations ─────────────────────────────────────────────
  
  // Last 6 months labels & bounds
  const monthRanges = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const start = new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1));
    const end = new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999));
    monthRanges.push({ start, end, label: d.toLocaleString("en-US", { month: "short" }) });
  }

  // Last 30 days labels & bounds (daily chart)
  const dayRanges = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = String(d.getDate()).padStart(2, "0");
    dayRanges.push({ dateStr, dayLabel });
  }

  // Last 7 days labels & bounds (weekly attendance)
  const weekDayDataList = [];
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = weekdayNames[d.getDay()];
    weekDayDataList.push({ dateStr, label });
  }

  // Define global database range for historical records
  const rangeStart = monthRanges[0].start;
  const rangeEnd = monthRanges[5].end;

  const [
    allAdmissions,
    allPlans,
    allAttendances,
  ] = await Promise.all([
    prisma.student.findMany({
      where: { admissionDate: { gte: rangeStart, lte: rangeEnd } },
      select: { id: true, admissionDate: true },
    }),
    prisma.studentPlan.findMany({
      where: { startDate: { gte: rangeStart, lte: rangeEnd } },
      select: {
        startDate: true,
        studentId: true,
        fee: true,
        student: {
          select: {
            plans: {
              select: { id: true, startDate: true },
            },
          },
        },
      },
    }),
    prisma.attendance.findMany({
      where: { date: { gte: rangeStart, lte: rangeEnd } },
      select: { date: true },
    }),
  ]);

  // Helper check for renewals
  const checkIsRenewal = (plan: typeof allPlans[0]) => {
    return plan.student.plans.some(
      (p) => p.startDate.getTime() < plan.startDate.getTime()
    );
  };

  // 1. Monthly Admissions
  const admissionsMonthly = monthRanges.map((m) => {
    const count = allAdmissions.filter((s) => s.admissionDate >= m.start && s.admissionDate <= m.end).length;
    return { month: m.label, admissions: count };
  });

  // 2. Monthly Renewals
  const renewalsMonthly = monthRanges.map((m) => {
    const count = allPlans.filter((p) => p.startDate >= m.start && p.startDate <= m.end && checkIsRenewal(p)).length;
    return { month: m.label, renewals: count };
  });

  // 3. Monthly Revenue (in Lakhs)
  const revenueMonthly = monthRanges.map((m) => {
    const sumFee = allPlans.filter((p) => p.startDate >= m.start && p.startDate <= m.end).reduce((sum, p) => sum + p.fee, 0);
    return { month: m.label, revenue: Number((sumFee / 100000).toFixed(2)) };
  });

  // 4. Weekly Attendance (last 7 days)
  const attendanceWeekly = weekDayDataList.map((wd) => {
    const count = allAttendances.filter((a) => a.date.toISOString().slice(0, 10) === wd.dateStr).length;
    return { day: wd.label, present: count };
  });

  // 5. Monthly Total Attendance
  const attendanceMonthly = monthRanges.map((m) => {
    const monthRecs = allAttendances.filter((a) => a.date >= m.start && a.date <= m.end);
    return { month: m.label, present: monthRecs.length };
  });

  // 6. Daily Admissions (last 30 days)
  const admissionsDaily = dayRanges.map((d) => {
    const count = allAdmissions.filter((s) => s.admissionDate.toISOString().slice(0, 10) === d.dateStr).length;
    return { day: d.dayLabel, admissions: count };
  });

  // 7. Daily Renewals (last 30 days)
  const renewalsDaily = dayRanges.map((d) => {
    const count = allPlans.filter((p) => p.startDate.toISOString().slice(0, 10) === d.dateStr && checkIsRenewal(p)).length;
    return { day: d.dayLabel, renewals: count };
  });

  // 8. Daily Attendance (last 30 days)
  const attendanceDaily = dayRanges.map((d) => {
    const count = allAttendances.filter((a) => a.date.toISOString().slice(0, 10) === d.dateStr).length;
    return { day: d.dayLabel, present: count };
  });

  return {
    kpis: {
      activeStudents,
      gracePeriodStudents,
      freezeStudents,
      admissionsThisMonth: admissionsThisMonthCount,
      todayAttendanceCount,
      monthlyRevenue,
    },
    attendanceDaily,
    attendanceWeekly,
    attendanceMonthly,
    admissionsDaily,
    admissionsMonthly,
    renewalsDaily,
    renewalsMonthly,
    revenueMonthly,
  };
}
