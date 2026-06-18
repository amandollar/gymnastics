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
      notes: s.notes || "",
    };
  });

  if (statusFilter && statusFilter !== "ALL") {
    return formatted.filter((s) => s.status === statusFilter);
  }

  return formatted;
}

export async function getAttendanceForExport(from?: string, to?: string) {
  const where: any = {};
  if (from || to) {
    where.date = {};
    if (from) {
      where.date.gte = new Date(from);
    }
    if (to) {
      // set to end of that day (23:59:59.999) to cover all attendance on that date
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.date.lte = toDate;
    }
  }

  const attendance = await prisma.attendance.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      student: {
        select: {
          studentNumber: true,
          name: true,
        },
      },
      studentPlan: {
        select: {
          planType: true,
        },
      },
    },
  });

  return attendance.map((a) => ({
    date: a.date.toISOString().split("T")[0],
    studentNumber: a.student?.studentNumber ?? "",
    studentName: a.student?.name ?? "",
    planType: a.studentPlan?.planType ?? "",
    createdAt: a.createdAt.toISOString(),
  }));
}

export async function getPaymentsForExport(from?: string, to?: string) {
  const where: any = {};
  if (from || to) {
    where.paidAt = {};
    if (from) {
      where.paidAt.gte = new Date(from);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.paidAt.lte = toDate;
    }
  }

  const payments = await prisma.paymentRecord.findMany({
    where,
    orderBy: { paidAt: "desc" },
    include: {
      student: {
        select: {
          studentNumber: true,
          name: true,
        },
      },
    },
  });

  return payments.map((p) => ({
    invoiceNumber: p.invoiceNumber,
    studentNumber: p.student?.studentNumber ?? "",
    studentName: p.student?.name ?? "",
    amount: p.amount,
    method: p.method,
    paidAt: p.paidAt.toISOString().split("T")[0],
    notes: p.notes || "",
  }));
}
