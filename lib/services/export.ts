import { prisma } from "@/lib/prisma";
import { computeStudentStatus } from "@/lib/utils/student";

export async function getStudentsForExport(statusFilter?: string) {
  const students = await prisma.student.findMany({
    orderBy: { studentNumber: "asc" },
    include: {
      plans: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          freezePeriods: true,
          attendances: {
            orderBy: { date: "desc" },
            take: 1,
            select: { date: true },
          },
        },
      },
    },
  });

  const formatted = students.map((s) => {
    const activePlan = s.plans[0] ?? null;
    const status = computeStudentStatus(
      activePlan
        ? {
            sessionsCompleted: activePlan.sessionsCompleted,
            totalSessions: activePlan.totalSessions,
            endDate: activePlan.endDate,
            expiryDate: activePlan.expiryDate,
            freezeStartDate: activePlan.freezeStartDate,
            freezeEndDate: activePlan.freezeEndDate,
            freezePeriods: activePlan.freezePeriods,
            lastAttendanceDate: activePlan.attendances?.[0]?.date ?? null,
          }
        : null
    );

    const sessionsPending = activePlan
      ? Math.max(0, activePlan.totalSessions - activePlan.sessionsCompleted)
      : 0;

    return {
      studentNumber: s.studentNumber,
      name: s.name,
      dateOfBirth: s.dateOfBirth.toISOString().split("T")[0],
      gender: s.gender,
      parentName: s.parentName,
      contactNumber: s.contactNumber,
      admissionDate: s.admissionDate.toISOString().split("T")[0],
      level: s.level,
      status: status,
      activePlanType: activePlan?.planType ?? "None",
      activePlanStartDate: activePlan?.startDate ? activePlan.startDate.toISOString().split("T")[0] : "",
      activePlanEndDate: activePlan?.endDate ? activePlan.endDate.toISOString().split("T")[0] : "",
      activePlanExpiryDate: activePlan?.expiryDate ? activePlan.expiryDate.toISOString().split("T")[0] : "",
      activePlanFee: activePlan?.fee ?? "",
      activePlanDiscountPercent: activePlan?.discountPercent ?? "",
      sessionsTotal: activePlan?.totalSessions ?? "",
      sessionsCompleted: activePlan?.sessionsCompleted ?? "",
      sessionsPending: activePlan ? sessionsPending : "",
      lastAttendanceDate: activePlan?.attendances?.[0]?.date ? activePlan.attendances[0].date.toISOString().split("T")[0] : "",
      notes: s.notes || "",
    };
  });

  if (statusFilter && statusFilter !== "ALL") {
    return formatted.filter((s) => s.status === statusFilter);
  }

  return formatted;
}

export async function getCoachesForExport() {
  const coaches = await prisma.coach.findMany({
    orderBy: { name: "asc" },
  });

  return coaches.map((c) => ({
    name: c.name,
    contactNumber: c.contactNumber,
    email: c.email || "",
    role: c.role === "COACH" ? "Coach" : "Staff",
    status: c.status,
    fixedSalary: c.fixedSalary,
    timing: c.timing || "",
    specialization: c.specialization || "",
    address: c.address || "",
    joinDate: c.joinDate.toISOString().split("T")[0],
    notes: c.notes || "",
  }));
}

export async function getFinanceForExport(from?: string, to?: string) {
  // Fetch student fee payments (Income)
  const paymentsWhere: any = {};
  if (from || to) {
    paymentsWhere.paidAt = {};
    if (from) paymentsWhere.paidAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      paymentsWhere.paidAt.lte = toDate;
    }
  }
  const payments = await prisma.paymentRecord.findMany({
    where: paymentsWhere,
    orderBy: { paidAt: "desc" },
    include: {
      student: { select: { studentNumber: true, name: true } },
      studentPlan: { select: { planType: true } },
    },
  });

  // Fetch paid coach salary payments (Expense)
  const salaryWhere: any = { paid: true };
  if (from || to) {
    salaryWhere.paidAt = {};
    if (from) salaryWhere.paidAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      salaryWhere.paidAt.lte = toDate;
    }
  }
  const salaryPayments = await prisma.coachSalaryPayment.findMany({
    where: salaryWhere,
    orderBy: { paidAt: "desc" },
    include: {
      coach: { select: { name: true } },
    },
  });

  const ledger: any[] = [];

  // Map student payments (Income)
  for (const p of payments) {
    ledger.push({
      date: p.paidAt.toISOString().split("T")[0],
      type: "Income (Fee Payment)",
      reference: `Invoice #${p.invoiceNumber}`,
      partyName: `${p.student?.name || "Unknown"} (TAG ${p.student?.studentNumber || ""})`,
      description: `Fee payment for student plan type ${p.studentPlan?.planType || ""}`,
      method: p.method,
      amount: p.amount,
      status: "Paid",
    });
  }

  // Map coach payouts (Expense)
  for (const s of salaryPayments) {
    const monthName = new Date(s.year, s.month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
    ledger.push({
      date: s.paidAt ? s.paidAt.toISOString().split("T")[0] : s.createdAt.toISOString().split("T")[0],
      type: "Expense (Coach Salary)",
      reference: `Payout`,
      partyName: s.coach?.name || "Unknown Coach",
      description: `Salary payout for month ${monthName}`,
      method: "BANK_TRANSFER",
      amount: -s.amount,
      status: "Paid",
    });
  }

  // Sort chronologically (newest first)
  ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return ledger;
}
