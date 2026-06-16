"use server";

import { auth } from "@/auth";
import { revalidatePath, updateTag } from "next/cache";
import { createPayment, getStudentsWithDues, getPaymentById } from "@/lib/services/payments";
import type { PaymentMethod } from "@prisma/client";

async function assertCanManage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "MANAGER")) {
    throw new Error("Unauthorized");
  }
}

// ─── Search students with outstanding dues ────────────────────────────────────

export async function searchStudentsWithDuesAction(query?: string) {
  try {
    await assertCanManage();
    const students = await getStudentsWithDues();

    if (!query?.trim()) return students;

    const q = query.trim().toLowerCase();

    // Filter ONLY by student name or student number starting with query
    const filtered = students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentNumber.toString().startsWith(q)
    );

    // Sort to prioritize exact/prefix Student ID matches
    return filtered.sort((a, b) => {
      const aStr = a.studentNumber.toString();
      const bStr = b.studentNumber.toString();

      if (aStr === q && bStr !== q) return -1;
      if (bStr === q && aStr !== q) return 1;

      const aStarts = aStr.startsWith(q);
      const bStarts = bStr.startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;

      const aNameStarts = a.name.toLowerCase().startsWith(q);
      const bNameStarts = b.name.toLowerCase().startsWith(q);
      if (aNameStarts && !bNameStarts) return -1;
      if (bNameStarts && !aNameStarts) return 1;

      return 0;
    });
  } catch {
    return [];
  }
}

// ─── Collect Fee Action ────────────────────────────────────────────────────────

export async function collectFeeAction(
  _prev: unknown,
  formData: FormData
): Promise<{ success: boolean; message?: string; paymentId?: string; invoiceNumber?: number }> {
  try {
    await assertCanManage();

    const studentPlanId = formData.get("studentPlanId");
    const studentId = formData.get("studentId");
    const amountRaw = formData.get("amount");
    const method = formData.get("method") as PaymentMethod | null;
    const notes = formData.get("notes") as string | null;

    if (
      typeof studentPlanId !== "string" ||
      typeof studentId !== "string" ||
      typeof amountRaw !== "string" ||
      !studentPlanId ||
      !studentId ||
      !amountRaw
    ) {
      return { success: false, message: "Missing required fields" };
    }

    const amount = parseInt(amountRaw, 10);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, message: "Amount must be a positive number" };
    }

    const validMethods: PaymentMethod[] = ["UPI", "CASH", "BANK_TRANSFER", "OTHER"];
    const paymentMethod: PaymentMethod =
      method && validMethods.includes(method) ? method : "CASH";

    const payment = await createPayment({
      studentPlanId,
      studentId,
      amount,
      method: paymentMethod,
      notes: notes?.trim() || null,
    });

    revalidatePath(`/students/${studentId}`);
    revalidatePath("/students");
    revalidatePath("/dashboard");
    updateTag("students");

    return {
      success: true,
      paymentId: payment.id,
      invoiceNumber: payment.invoiceNumber,
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to record payment",
    };
  }
}

export async function getPaymentByIdAction(paymentId: string) {
  try {
    await assertCanManage();
    const payment = await getPaymentById(paymentId);
    if (!payment) return null;
    return JSON.parse(JSON.stringify(payment)); // clean serialization
  } catch {
    return null;
  }
}
