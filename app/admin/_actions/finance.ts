"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";

export async function addFinanceTransaction(data: {
  type: "INCOME" | "EXPENDITURE" | "INVESTMENT";
  category: string;
  amount: number;
  date: string;
  description: string;
}) {
  const mappedType = data.type === "INCOME" ? "INCOME" : "EXPENDITURE";
  await prisma.$transaction([
    prisma.financeTransaction.create({
      data: {
        type: data.type,
        category: data.category,
        amount: data.amount,
        date: new Date(data.date),
        description: data.description,
      },
    }),
    prisma.financeCategory.upsert({
      where: {
        name_type: { name: data.category, type: mappedType },
      },
      update: { isActive: true },
      create: { name: data.category, type: mappedType, isActive: true },
    }),
  ]);

  revalidateTag("finance", { expire: 0 });
  revalidatePath("/admin/finance");
}

export async function setBudgetCategory(data: {
  category: string;
  amount: number;
  month: number;
  year: number;
}) {
  await prisma.budgetCategory.upsert({
    where: {
      category_month_year: {
        category: data.category,
        month: data.month,
        year: data.year,
      },
    },
    update: {
      amount: data.amount,
    },
    create: {
      category: data.category,
      amount: data.amount,
      month: data.month,
      year: data.year,
    },
  });

  revalidateTag("finance", { expire: 0 });
  revalidatePath("/admin/finance");
}

export async function addAutoPay(data: {
  type: "INCOME" | "EXPENDITURE" | "INVESTMENT";
  category: string;
  amount: number;
  startDate: string;
  description?: string;
}) {
  const mappedType = data.type === "INCOME" ? "INCOME" : "EXPENDITURE";
  await prisma.$transaction([
    prisma.autoPay.create({
      data: {
        type: data.type,
        category: data.category,
        amount: data.amount,
        startDate: new Date(data.startDate),
        description: data.description,
      },
    }),
    prisma.financeCategory.upsert({
      where: {
        name_type: { name: data.category, type: mappedType },
      },
      update: { isActive: true },
      create: { name: data.category, type: mappedType, isActive: true },
    }),
  ]);

  revalidateTag("finance", { expire: 0 });
  revalidatePath("/admin/finance");
}

export async function editAutoPay(data: {
  id: string;
  category: string;
  amount: number;
  description?: string;
  effectiveFromMonthStr: string;
}) {
  const [year, month] = data.effectiveFromMonthStr.split("-").map(Number);
  const startOfCurrentMonth = new Date(year, month - 1, 1);

  const oldRule = await prisma.autoPay.findUnique({ where: { id: data.id } });
  if (!oldRule) return;

  if (new Date(oldRule.startDate) >= startOfCurrentMonth) {
    // Just update the record directly
    await prisma.autoPay.update({
      where: { id: data.id },
      data: {
        category: data.category,
        amount: data.amount,
        description: data.description,
      },
    });
  } else {
    // End old rule on previous month
    await prisma.autoPay.update({
      where: { id: data.id },
      data: {
        endDate: new Date(year, month - 1, 0, 23, 59, 59),
      },
    });

    // Create new rule from current month onwards
    await prisma.autoPay.create({
      data: {
        type: oldRule.type,
        category: data.category,
        amount: data.amount,
        startDate: startOfCurrentMonth,
        description: data.description,
      },
    });
  }

  revalidateTag("finance", { expire: 0 });
  revalidatePath("/admin/finance");
}

export async function deleteAutoPay(data: {
  id: string;
  effectiveFromMonthStr: string;
}) {
  const [year, month] = data.effectiveFromMonthStr.split("-").map(Number);
  const startOfCurrentMonth = new Date(year, month - 1, 1);

  const oldRule = await prisma.autoPay.findUnique({ where: { id: data.id } });
  if (!oldRule) return;

  if (new Date(oldRule.startDate) >= startOfCurrentMonth) {
    // Just delete it if it started this month
    await prisma.autoPay.delete({ where: { id: data.id } });
  } else {
    // End the rule on previous month so past entries stay intact
    await prisma.autoPay.update({
      where: { id: data.id },
      data: {
        endDate: new Date(year, month - 1, 0, 23, 59, 59),
      },
    });
  }

  revalidateTag("finance", { expire: 0 });
  revalidatePath("/admin/finance");
}

export async function addCategory(data: {
  name: string;
  type: "INCOME" | "EXPENDITURE" | "INVESTMENT";
}) {
  const mappedType = data.type === "INCOME" ? "INCOME" : "EXPENDITURE";
  await prisma.financeCategory.upsert({
    where: {
      name_type: { name: data.name, type: mappedType },
    },
    update: { isActive: true },
    create: { name: data.name, type: mappedType, isActive: true },
  });

  revalidateTag("finance", { expire: 0 });
  revalidatePath("/admin/finance");
}

export async function updateCategoryName(data: {
  id: string;
  newName: string;
}) {
  await prisma.financeCategory.update({
    where: { id: data.id },
    data: { name: data.newName },
  });

  revalidateTag("finance", { expire: 0 });
  revalidatePath("/admin/finance");
}

export async function deleteCategory(data: { id: string }) {
  await prisma.financeCategory.update({
    where: { id: data.id },
    data: { isActive: false },
  });

  revalidateTag("finance", { expire: 0 });
  revalidatePath("/admin/finance");
}
