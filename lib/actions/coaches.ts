"use server";

import { auth } from "@/auth";
import { revalidatePath, updateTag } from "next/cache";
import {
  createCoach,
  updateCoach,
  markCoachAttendance,
  deleteCoachAttendance,
} from "@/lib/services/coaches";
import type { CoachAttendanceStatus, CoachRole } from "@prisma/client";

async function assertCanManage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "STAFF")) {
    throw new Error("Unauthorized");
  }
}

// ─── Create Coach ─────────────────────────────────────────────────────────────

export async function createCoachAction(
  _prev: unknown,
  formData: FormData
): Promise<{ success: boolean; message?: string }> {
  try {
    await assertCanManage();

    const name = formData.get("name") as string;
    const contactNumber = formData.get("contactNumber") as string;
    const email = (formData.get("email") as string) || undefined;
    const joinDate = formData.get("joinDate") as string;
    const timing = (formData.get("timing") as string) || undefined;
    const specialization = (formData.get("specialization") as string) || undefined;
    const fixedSalary = parseInt(formData.get("fixedSalary") as string) || 0;
    const role = (formData.get("role") as CoachRole) || "COACH";
    const notes = (formData.get("notes") as string) || undefined;
    const address = (formData.get("address") as string) || undefined;
    const avatarFile = formData.get("avatar");

    if (!name?.trim()) return { success: false, message: "Name is required" };
    if (!contactNumber?.trim()) return { success: false, message: "Contact number is required" };
    if (!address?.trim()) return { success: false, message: "Address is required" };
    if (!joinDate) return { success: false, message: "Join date is required" };
    if (role === "STAFF" && !email?.trim()) {
      return { success: false, message: "Email is required for staff employees" };
    }

    await createCoach({
      name: name.trim(),
      contactNumber: contactNumber.trim(),
      email: email?.trim() || undefined,
      joinDate: new Date(joinDate),
      timing: timing?.trim() || undefined,
      specialization: specialization?.trim() || undefined,
      fixedSalary,
      role,
      notes: notes?.trim() || undefined,
      address: address.trim(),
      avatarFile: avatarFile instanceof File && avatarFile.size > 0 ? avatarFile : null,
    });

    revalidatePath("/admin/coaches");
    updateTag("coaches");

    return { success: true, message: "Employee added successfully" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to create employee",
    };
  }
}

// ─── Update Coach ─────────────────────────────────────────────────────────────

export async function updateCoachAction(
  coachId: string,
  _prev: unknown,
  formData: FormData
): Promise<{ success: boolean; message?: string }> {
  try {
    await assertCanManage();

    const name = formData.get("name") as string;
    const contactNumber = formData.get("contactNumber") as string;
    const email = (formData.get("email") as string) || null;
    const joinDate = formData.get("joinDate") as string;
    const timing = (formData.get("timing") as string) || null;
    const specialization = (formData.get("specialization") as string) || null;
    const fixedSalary = parseInt(formData.get("fixedSalary") as string) || 0;
    const status = formData.get("status") as "WORKING" | "LEFT";
    const role = (formData.get("role") as CoachRole) || "COACH";
    const notes = (formData.get("notes") as string) || null;
    const address = (formData.get("address") as string) || null;
    const avatarFile = formData.get("avatar");

    if (!name?.trim()) return { success: false, message: "Name is required" };
    if (!contactNumber?.trim()) return { success: false, message: "Contact number is required" };
    if (!address?.trim()) return { success: false, message: "Address is required" };
    if (role === "STAFF" && !email?.trim()) {
      return { success: false, message: "Email is required for staff employees" };
    }

    await updateCoach(coachId, {
      name: name.trim(),
      contactNumber: contactNumber.trim(),
      email: email?.trim() || null,
      ...(joinDate ? { joinDate: new Date(joinDate) } : {}),
      timing: timing?.trim() || null,
      specialization: specialization?.trim() || null,
      fixedSalary,
      status: status || "WORKING",
      role,
      notes: notes?.trim() || null,
      address: address.trim(),
      avatarFile: avatarFile instanceof File && avatarFile.size > 0 ? avatarFile : null,
    });

    revalidatePath("/admin/coaches");
    updateTag("coaches");

    return { success: true, message: "Coach updated successfully" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to update coach",
    };
  }
}

// ─── Mark Coach Attendance ────────────────────────────────────────────────────

export async function markCoachAttendanceAction(
  coachId: string,
  dateStr: string,
  status: CoachAttendanceStatus
): Promise<{ success: boolean; message?: string }> {
  try {
    // Any logged-in user can mark attendance
    const session = await auth();
    if (!session) throw new Error("Unauthorized");

    await markCoachAttendance(coachId, dateStr, status);

    revalidatePath("/admin/coaches");
    updateTag("coaches");

    return { success: true };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to mark attendance",
    };
  }
}

export async function deleteCoachAttendanceAction(
  coachId: string,
  dateStr: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");

    await deleteCoachAttendance(coachId, dateStr);

    revalidatePath("/admin/coaches");
    updateTag("coaches");

    return { success: true };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to clear attendance",
    };
  }
}

// ─── Get Coach Earnings ───────────────────────────────────────────────────────

export async function getCoachEarningsAction(coachId: string) {
  try {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");

    const { getCoachEarnings } = await import("@/lib/services/coaches");
    const rows = await getCoachEarnings(coachId);

    // Serialize dates to strings for client
    return {
      success: true,
      rows: rows.map((r) => ({
        ...r,
        planStartDate: r.planStartDate.toISOString(),
        planEndDate: r.planEndDate.toISOString(),
      })),
    };
  } catch (e) {
    return {
      success: false,
      rows: [],
      message: e instanceof Error ? e.message : "Failed to load earnings",
    };
  }
}


export async function assignCoachToPlanAction(
  studentPlanId: string,
  coachId: string | null
): Promise<{ success: boolean; message?: string }> {
  try {
    await assertCanManage();

    const { prisma } = await import("@/lib/prisma");
    const plan = await (prisma as any).studentPlan.findUnique({
      where: { id: studentPlanId },
      select: { planType: true, studentId: true },
    });
    if (!plan) return { success: false, message: "Plan not found" };
    if (plan.planType !== "ONE_TO_ONE") {
      return { success: false, message: "Coach can only be assigned to personal training plans" };
    }

    await (prisma as any).studentPlan.update({
      where: { id: studentPlanId },
      data: { coachId: coachId ?? null },
    });

    revalidatePath("/admin/coaches");
    revalidatePath(`/admin/students/${plan.studentId}`);
    updateTag("coaches");
    updateTag("students");

    return { success: true, message: "Coach assigned successfully" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to assign coach",
    };
  }
}

export async function getCoachMonthlyAttendanceAction(
  coachId: string,
  year: number,
  month: number
): Promise<{ success: boolean; attendance: Record<string, CoachAttendanceStatus>; message?: string }> {
  try {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");

    const { prisma } = await import("@/lib/prisma");
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const records = await (prisma as any).coachAttendance.findMany({
      where: {
        coachId,
        date: { gte: start, lt: end },
      },
      select: { date: true, status: true },
    });

    const attendance: Record<string, CoachAttendanceStatus> = {};
    for (const r of records) {
      const dateStr = new Date(r.date).toISOString().split("T")[0];
      attendance[dateStr] = r.status;
    }

    return { success: true, attendance };
  } catch (e) {
    return {
      success: false,
      attendance: {},
      message: e instanceof Error ? e.message : "Failed to load attendance",
    };
  }
}

export async function toggleCoachSalaryPaymentAction(
  coachId: string,
  year: number,
  month: number,
  paid: boolean,
  amount: number
): Promise<{ success: boolean; message?: string }> {
  try {
    await assertCanManage();

    const { toggleCoachSalaryPayment } = await import("@/lib/services/coaches");
    await toggleCoachSalaryPayment(coachId, year, month, paid, amount);

    revalidatePath(`/admin/coaches/${coachId}`);
    return { success: true, message: `Salary payment marked as ${paid ? "paid" : "unpaid"}` };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to update salary payment status",
    };
  }
}
