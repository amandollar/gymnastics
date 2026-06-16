"use server";

import { auth } from "@/auth";
import { revalidatePath, updateTag } from "next/cache";
import { freezeStudentPlan, unfreezeStudentPlan, addFreezePeriod, deleteFreezePeriod } from "@/lib/services/students";
import { parseDateInput } from "@/lib/utils/student";

async function assertCanManage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "MANAGER")) {
    throw new Error("Unauthorized");
  }
}

/**
 * Apply a holiday freeze to a student's active plan.
 * Extends the plan's endDate and expiryDate by the freeze duration.
 */
export async function freezePlanAction(
  _prev: unknown,
  formData: FormData
): Promise<{ success: boolean; message?: string }> {
  try {
    await assertCanManage();

    const studentPlanId = formData.get("studentPlanId");
    const freezeStartRaw = formData.get("freezeStartDate");
    const freezeEndRaw = formData.get("freezeEndDate");

    if (
      typeof studentPlanId !== "string" ||
      typeof freezeStartRaw !== "string" ||
      typeof freezeEndRaw !== "string" ||
      !studentPlanId ||
      !freezeStartRaw ||
      !freezeEndRaw
    ) {
      return { success: false, message: "Missing required fields" };
    }

    const freezeStart = parseDateInput(freezeStartRaw);
    const freezeEnd = parseDateInput(freezeEndRaw);

    await freezeStudentPlan(studentPlanId, freezeStart, freezeEnd);

    const studentId = formData.get("studentId") as string | null;
    if (studentId) {
      revalidatePath(`/students/${studentId}`);
      revalidatePath("/students");
      revalidatePath("/dashboard");
      updateTag("students");
      updateTag("attendance");
    }

    return {
      success: true,
      message: "Plan frozen. End date and grace deadline have been extended.",
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to freeze plan",
    };
  }
}

/** Remove the freeze from a student plan (dates stay extended). */
export async function unfreezePlanAction(
  _prev: unknown,
  formData: FormData
): Promise<{ success: boolean; message?: string }> {
  try {
    await assertCanManage();

    const studentPlanId = formData.get("studentPlanId");
    if (typeof studentPlanId !== "string" || !studentPlanId) {
      return { success: false, message: "Missing studentPlanId" };
    }

    await unfreezeStudentPlan(studentPlanId);

    const studentId = formData.get("studentId") as string | null;
    if (studentId) {
      revalidatePath(`/students/${studentId}`);
      revalidatePath("/students");
      revalidatePath("/dashboard");
      updateTag("students");
      updateTag("attendance");
    }

    return { success: true, message: "Freeze removed." };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to unfreeze plan",
    };
  }
}

export async function addFreezePeriodAction(
  _prev: unknown,
  formData: FormData
): Promise<{ success: boolean; message?: string }> {
  try {
    await assertCanManage();

    const studentPlanId = formData.get("studentPlanId");
    const startDateRaw = formData.get("freezeStartDate");
    const endDateRaw = formData.get("freezeEndDate");

    if (
      typeof studentPlanId !== "string" ||
      typeof startDateRaw !== "string" ||
      typeof endDateRaw !== "string" ||
      !studentPlanId ||
      !startDateRaw ||
      !endDateRaw
    ) {
      return { success: false, message: "Missing required fields" };
    }

    const startDate = parseDateInput(startDateRaw);
    const endDate = parseDateInput(endDateRaw);

    await addFreezePeriod(studentPlanId, startDate, endDate);

    const studentId = formData.get("studentId") as string | null;
    if (studentId) {
      revalidatePath(`/students/${studentId}`);
      revalidatePath("/students");
      revalidatePath("/dashboard");
      updateTag("students");
      updateTag("attendance");
    }

    return {
      success: true,
      message: "Freeze period added. Plan has been extended.",
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to add freeze period",
    };
  }
}

export async function deleteFreezePeriodAction(
  _prev: unknown,
  formData: FormData
): Promise<{ success: boolean; message?: string }> {
  try {
    await assertCanManage();

    const freezePeriodId = formData.get("freezePeriodId");
    if (typeof freezePeriodId !== "string" || !freezePeriodId) {
      return { success: false, message: "Missing freezePeriodId" };
    }

    await deleteFreezePeriod(freezePeriodId);

    const studentId = formData.get("studentId") as string | null;
    if (studentId) {
      revalidatePath(`/students/${studentId}`);
      revalidatePath("/students");
      revalidatePath("/dashboard");
      updateTag("students");
      updateTag("attendance");
    }

    return { success: true, message: "Freeze period deleted and plan duration reduced." };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to delete freeze period",
    };
  }
}
