import { prisma } from "@/lib/prisma";
import { computeStudentStatus } from "@/lib/utils/student";

export type DashboardKpis = {
  activeStudents: number;
  gracePeriodStudents: number;
  freezeStudents: number;
  inactiveStudents: number;
  admissionsThisMonth: number;
  todayAttendanceCount: number;
  monthlyRevenue: number;
};

export type ChartDataPoint = {
  label: string;
  value: number;
};

export type DashboardStudent = {
  id: string;
  name: string;
  studentNumber: number;
  contactNumber: string;
  avatarUrl: string | null;
  gender: string | null;
  sessionsCompleted: number;
  totalSessions: number;
  statusEntryDate: string;
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
  revenueDaily: { label: string; revenue: number }[];
  revenueMonthly: { label: string; revenue: number }[];
  recentActivity: { id: string; text: string; timestamp: string }[];
  graceStudents: DashboardStudent[];
  inactiveStudents: DashboardStudent[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Month boundaries in UTC
  const startOfCurMonth = new Date(Date.UTC(currentYear, currentMonth, 1));
  const endOfCurMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));

  // Year boundaries in UTC
  const startOfCurYear = new Date(Date.UTC(currentYear, 0, 1));
  const endOfCurYear = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));

  // Today boundaries
  const todayStr = now.toISOString().slice(0, 10);
  const todayDate = new Date(todayStr + "T00:00:00.000Z");

  // Parallel database fetch for KPI indicators
  const [
    students,
    admissionsThisMonthCount,
    todayAttendanceCount,
    revenuePaymentSum,
    currentYearPayments,
  ] = await Promise.all([
    prisma.student.findMany({
      select: {
        id: true,
        name: true,
        studentNumber: true,
        contactNumber: true,
        avatarUrl: true,
        gender: true,
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
            attendances: {
              orderBy: { date: "desc" },
              take: 1,
              select: { date: true },
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
    (prisma as any).paymentRecord.aggregate({
      where: { paidAt: { gte: startOfCurMonth, lte: endOfCurMonth } },
      _sum: { amount: true },
    }),
    (prisma as any).paymentRecord.findMany({
      where: { paidAt: { gte: startOfCurYear, lte: endOfCurYear } },
      select: { paidAt: true, amount: true },
    }),
  ]);

  // Compute active vs grace vs freeze vs inactive count in-memory
  let activeStudents = 0;
  let gracePeriodStudents = 0;
  let freezeStudents = 0;
  let inactiveStudents = 0;

  const graceStudentsList: DashboardStudent[] = [];
  const inactiveStudentsList: DashboardStudent[] = [];

  for (const s of students) {
    const activePlan = s.plans[0];
    const status = computeStudentStatus(
      activePlan
        ? {
            ...activePlan,
            lastAttendanceDate: activePlan.attendances?.[0]?.date ?? null,
          }
        : null
    );
    if (status === "ACTIVE") {
      activeStudents++;
    } else if (status === "FREEZE") {
      freezeStudents++;
    } else if (status === "GRACE") {
      gracePeriodStudents++;
      if (activePlan) {
        graceStudentsList.push({
          id: s.id,
          name: s.name,
          studentNumber: s.studentNumber,
          contactNumber: s.contactNumber,
          avatarUrl: s.avatarUrl,
          gender: s.gender,
          sessionsCompleted: activePlan.sessionsCompleted,
          totalSessions: activePlan.totalSessions,
          statusEntryDate: activePlan.endDate.toISOString(),
        });
      }
    } else if (status === "INACTIVE" || status === "EXPIRED") {
      if (status === "INACTIVE") {
        inactiveStudents++;
      }
      if (activePlan) {
        let entryDate = activePlan.expiryDate;
        if (activePlan.sessionsCompleted >= activePlan.totalSessions) {
          entryDate = activePlan.attendances?.[0]?.date ?? activePlan.endDate;
        }
        inactiveStudentsList.push({
          id: s.id,
          name: s.name,
          studentNumber: s.studentNumber,
          contactNumber: s.contactNumber,
          avatarUrl: s.avatarUrl,
          gender: s.gender,
          sessionsCompleted: activePlan.sessionsCompleted,
          totalSessions: activePlan.totalSessions,
          statusEntryDate: entryDate.toISOString(),
        });
      }
    }
  }

  const monthlyRevenue = revenuePaymentSum._sum.amount ?? 0;

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

  // 3. Daily Revenue for current month (real payment data)
  const daysInCurMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const revenueDaily = [];
  for (let d = 1; d <= daysInCurMonth; d++) {
    const startOfDay = new Date(Date.UTC(currentYear, currentMonth, d, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(currentYear, currentMonth, d, 23, 59, 59, 999));
    const sumAmount = currentYearPayments
      .filter((p: any) => p.paidAt >= startOfDay && p.paidAt <= endOfDay)
      .reduce((sum: number, p: any) => sum + p.amount, 0);
    revenueDaily.push({
      label: String(d),
      revenue: sumAmount,
    });
  }

  // Monthly Revenue for current year (real payment data)
  const monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const revenueMonthly = [];
  for (let m = 0; m < 12; m++) {
    const startOfM = new Date(Date.UTC(currentYear, m, 1));
    const endOfM = new Date(Date.UTC(currentYear, m + 1, 0, 23, 59, 59, 999));
    const sumAmount = currentYearPayments
      .filter((p: any) => p.paidAt >= startOfM && p.paidAt <= endOfM)
      .reduce((sum: number, p: any) => sum + p.amount, 0);
    revenueMonthly.push({
      label: monthsList[m],
      revenue: sumAmount,
    });
  }

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

  // 9. Recent Activity Data (Real admissions, payments, enquiries, renewals)
  const [
    recentStudents,
    recentPayments,
    recentEnquiries,
    recentPlans,
  ] = await Promise.all([
    prisma.student.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, createdAt: true },
    }),
    (prisma as any).paymentRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        amount: true,
        createdAt: true,
        student: { select: { name: true } },
      },
    }),
    prisma.enquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, childName: true, parentName: true, createdAt: true },
    }),
    prisma.studentPlan.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        planType: true,
        createdAt: true,
        startDate: true,
        student: {
          select: {
            name: true,
            plans: {
              select: { id: true, startDate: true },
            },
          },
        },
      },
    }),
  ]);

  const recentRenewals = recentPlans.filter((plan: any) => {
    return plan.student.plans.some(
      (p: any) => p.startDate.getTime() < plan.startDate.getTime()
    );
  }).slice(0, 8);

  const activities = [
    ...recentStudents.map((s: any) => ({
      id: `adm-${s.id}`,
      text: `${s.name} enrolled as a new student`,
      timestamp: s.createdAt,
    })),
    ...recentPayments.map((p: any) => ({
      id: `pay-${p.id}`,
      text: `Fee payment received — ₹${p.amount.toLocaleString("en-IN")} (${p.student.name})`,
      timestamp: p.createdAt,
    })),
    ...recentEnquiries.map((e: any) => ({
      id: `enq-${e.id}`,
      text: `New enquiry registered for ${e.childName} (${e.parentName})`,
      timestamp: e.createdAt,
    })),
    ...recentRenewals.map((r: any) => {
      const planName = r.planType === "ONE_TO_ONE" ? "Personal training" : "Group class";
      return {
        id: `ren-${r.id}`,
        text: `${r.student.name} renewed ${planName} plan`,
        timestamp: r.createdAt,
      };
    }),
  ];

  const recentActivity = activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 8)
    .map((act) => ({
      id: act.id,
      text: act.text,
      timestamp: act.timestamp.toISOString(),
    }));

  return {
    kpis: {
      activeStudents,
      gracePeriodStudents,
      freezeStudents,
      inactiveStudents,
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
    revenueDaily,
    revenueMonthly,
    recentActivity,
    graceStudents: graceStudentsList,
    inactiveStudents: inactiveStudentsList,
  };
}
