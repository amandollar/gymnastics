import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import FinancePageClient from "@/app/admin/_components/finance/FinancePageClient";
import { unstable_cache, revalidateTag } from "next/cache";

// ── Cached Database Fetches ───────────────────────────────────────────────────

const getCachedPayments = unstable_cache(
  async () => {
    return prisma.paymentRecord.findMany({
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
    });
  },
  ["finance-payments"],
  { tags: ["finance-payments", "finance"] }
);

const getCachedSalaryPayments = unstable_cache(
  async () => {
    return prisma.coachSalaryPayment.findMany({
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
    });
  },
  ["finance-salaries"],
  { tags: ["finance-salaries", "finance"] }
);

const getCachedActivePlans = unstable_cache(
  async () => {
    return prisma.studentPlan.findMany({
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
    });
  },
  ["finance-active-plans"],
  { tags: ["finance-active-plans", "finance"] }
);

const getCachedTransactions = unstable_cache(
  async () => {
    return prisma.financeTransaction.findMany({
      orderBy: { date: "desc" },
    });
  },
  ["finance-transactions"],
  { tags: ["finance-transactions", "finance"] }
);

const getCachedBudgets = unstable_cache(
  async () => {
    return prisma.budgetCategory.findMany({
      orderBy: { category: "asc" },
    });
  },
  ["finance-budgets"],
  { tags: ["finance-budgets", "finance"] }
);

const getCachedAutoPays = unstable_cache(
  async () => {
    return prisma.autoPay.findMany({
      orderBy: { createdAt: "desc" },
    });
  },
  ["finance-autopays"],
  { tags: ["finance-autopays", "finance"] }
);

const getCachedCategories = unstable_cache(
  async () => {
    return prisma.financeCategory.findMany({
      orderBy: { name: "asc" },
    });
  },
  ["finance-categories"],
  { tags: ["finance-categories", "finance"] }
);

// ── Page Component ────────────────────────────────────────────────────────────

export default async function FinancePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = session.user;
  const userRole = (user as { role?: string })?.role;
  
  if (userRole !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  // Fetch financial records in parallel from cache tags
  const [payments, salaryPayments, activePlans, financeTransactions, budgetCategories, autoPays, dbCategories] = await Promise.all([
    getCachedPayments(),
    getCachedSalaryPayments(),
    getCachedActivePlans(),
    getCachedTransactions(),
    getCachedBudgets(),
    getCachedAutoPays(),
    getCachedCategories(),
  ]);

  let financeCategories = dbCategories;
  if (financeCategories.length === 0) {
    const defaultIncome = ["Student Fees", "Registration Fee", "Sponsorship", "Interest"];
    const defaultExpense = ["Rent", "Loan EMI", "Groceries", "Utilities", "Transport", "Shopping", "Salaries"];

    await prisma.$transaction([
      ...defaultIncome.map((name) =>
        prisma.financeCategory.create({ data: { name, type: "INCOME", isActive: true } })
      ),
      ...defaultExpense.map((name) =>
        prisma.financeCategory.create({ data: { name, type: "EXPENDITURE", isActive: true } })
      ),
    ]);

    revalidateTag("finance-categories", { expire: 0 });
    financeCategories = await getCachedCategories();
  }

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <React.Suspense fallback={<div className="p-8 text-center text-zinc-550 dark:text-zinc-400">Loading Finance...</div>}>
        <FinancePageClient
          payments={JSON.parse(JSON.stringify(payments))}
          salaryPayments={JSON.parse(JSON.stringify(salaryPayments))}
          activePlans={JSON.parse(JSON.stringify(activePlans))}
          financeTransactions={JSON.parse(JSON.stringify(financeTransactions))}
          budgetCategories={JSON.parse(JSON.stringify(budgetCategories))}
          autoPays={JSON.parse(JSON.stringify(autoPays))}
          financeCategories={JSON.parse(JSON.stringify(financeCategories))}
        />
      </React.Suspense>
    </div>
  );
}
