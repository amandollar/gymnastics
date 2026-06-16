import { prisma } from "@/lib/prisma";
import type { PaymentMethod } from "@prisma/client";

// ─── Create Payment ───────────────────────────────────────────────────────────

export async function createPayment({
  studentPlanId,
  studentId,
  amount,
  method,
  notes,
}: {
  studentPlanId: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  notes?: string | null;
}) {
  return (prisma as any).paymentRecord.create({
    data: {
      studentPlanId,
      studentId,
      amount,
      method,
      notes: notes ?? null,
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          studentNumber: true,
          dateOfBirth: true,
          parentName: true,
          contactNumber: true,
        },
      },
      studentPlan: {
        select: {
          id: true,
          fee: true,
          planType: true,
          totalSessions: true,
          startDate: true,
          endDate: true,
          discountPercent: true,
          planMonths: true,
        },
      },
    },
  });
}

// ─── Get Payments by Student ──────────────────────────────────────────────────

export async function getPaymentsByStudent(studentId: string) {
  return (prisma as any).paymentRecord.findMany({
    where: { studentId },
    orderBy: { paidAt: "desc" },
    include: {
      studentPlan: {
        select: {
          id: true,
          fee: true,
          planType: true,
          totalSessions: true,
          startDate: true,
          endDate: true,
          discountPercent: true,
          planMonths: true,
        },
      },
    },
  });
}

// ─── Get Payments by Plan ─────────────────────────────────────────────────────

export async function getPaymentsByPlan(studentPlanId: string) {
  return (prisma as any).paymentRecord.findMany({
    where: { studentPlanId },
    orderBy: { paidAt: "asc" },
  });
}

// ─── Get a single payment with full details for receipt ───────────────────────

export async function getPaymentById(paymentId: string) {
  return (prisma as any).paymentRecord.findUnique({
    where: { id: paymentId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          studentNumber: true,
          dateOfBirth: true,
          parentName: true,
          contactNumber: true,
        },
      },
      studentPlan: {
        select: {
          id: true,
          fee: true,
          planType: true,
          totalSessions: true,
          startDate: true,
          endDate: true,
          discountPercent: true,
          planMonths: true,
          payments: {
            select: { amount: true },
          },
        },
      },
    },
  });
}

// ─── Get Outstanding Balance for a Plan ──────────────────────────────────────

export async function getOutstandingByPlan(
  studentPlanId: string,
  planFee: number
): Promise<number> {
  const result = await (prisma as any).paymentRecord.aggregate({
    where: { studentPlanId },
    _sum: { amount: true },
  });
  const paid = result._sum.amount ?? 0;
  return Math.max(0, planFee - paid);
}

// ─── Get all students with outstanding dues (for dashboard fee modal) ─────────

export interface StudentWithDues {
  id: string;
  studentNumber: number;
  name: string;
  parentName: string;
  contactNumber: string;
  activePlanId: string;
  planType: string;
  totalFee: number;
  paidAmount: number;
  outstanding: number;
  planMonths: number | null;
}

export async function getStudentsWithDues(): Promise<StudentWithDues[]> {
  // Fetch all active plans with their payments
  const plans = await (prisma as any).studentPlan.findMany({
    where: { isActive: true },
    select: {
      id: true,
      fee: true,
      planType: true,
      planMonths: true,
      student: {
        select: {
          id: true,
          studentNumber: true,
          name: true,
          parentName: true,
          contactNumber: true,
        },
      },
      payments: {
        select: { amount: true },
      },
    },
  }) as any[];

  const result: StudentWithDues[] = [];

  for (const plan of plans) {
    const paidAmount = (plan.payments as { amount: number }[]).reduce(
      (sum, p) => sum + p.amount,
      0
    );
    const outstanding = Math.max(0, plan.fee - paidAmount);

    // Only include students who have outstanding dues
    if (outstanding > 0) {
      result.push({
        id: plan.student.id,
        studentNumber: plan.student.studentNumber,
        name: plan.student.name,
        parentName: plan.student.parentName,
        contactNumber: plan.student.contactNumber,
        activePlanId: plan.id,
        planType: plan.planType,
        totalFee: plan.fee,
        paidAmount,
        outstanding,
        planMonths: plan.planMonths,
      });
    }
  }

  // Sort by outstanding amount descending
  return result.sort((a, b) => b.outstanding - a.outstanding);
}
