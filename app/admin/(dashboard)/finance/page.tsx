import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import FinancePageClient from "@/app/admin/_components/finance/FinancePageClient";

export default async function FinancePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = session.user;
  const userRole = (user as { role?: string })?.role;
  
  // Protect page: Only ADMIN role is authorized to access financial dashboards
  if (userRole !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  // Fetch financial transaction records in parallel
  const [payments, salaryPayments, activePlans] = await Promise.all([
    // 1. Student Fee Payments (Revenue)
    prisma.paymentRecord.findMany({
      orderBy: { paidAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            name: true,
            avatarUrl: true,
          },
        },
        studentPlan: {
          select: {
            planType: true,
          },
        },
      },
    }),
    
    // 2. Coach Salary Payments (Expenses)
    prisma.coachSalaryPayment.findMany({
      orderBy: [
        { year: "desc" },
        { month: "desc" },
      ],
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            status: true,
            role: true,
            fixedSalary: true,
          },
        },
      },
    }),

    // 3. Active Student Plans with their Payments (to compute Outstanding Fees)
    prisma.studentPlan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        startDate: "desc",
      },
      include: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            name: true,
            avatarUrl: true,
          },
        },
        payments: {
          select: {
            amount: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <FinancePageClient
        payments={JSON.parse(JSON.stringify(payments))}
        salaryPayments={JSON.parse(JSON.stringify(salaryPayments))}
        activePlans={JSON.parse(JSON.stringify(activePlans))}
      />
    </div>
  );
}
