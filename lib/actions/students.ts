"use server";

import { auth } from "@/auth";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import {
  assignPlanToStudent,
  createStudent,
  updateStudent,
  updateStudentLevel,
  parsePlanFormDates,
  updateStudentActivePlanBatch,
  updateStudentActivePlan,
  updateStudentNotesAndMedical,
} from "@/lib/services/students";
import { createStudentSchema, updateStudentSchema, assignPlanSchema } from "@/lib/validations/student";
import type { WeekdayName } from "@/lib/plan/calculations";
import { parseDateInput } from "@/lib/utils/student";
import type { PlanType, StudentLevel } from "@prisma/client";

async function assertCanManageStudents() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "MANAGER")) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createStudentAction(
  _prev: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  message?: string;
  studentId?: string;
  studentName?: string;
  studentNumber?: number;
  avatarUrl?: string | null;
  gender?: string;
  errors?: Record<string, string[]>;
  registrationFee?: number;
}> {
  try {
    await assertCanManageStudents();

    const raw = {
      name: formData.get("name"),
      dateOfBirth: formData.get("dateOfBirth"),
      gender: formData.get("gender"),
      parentName: formData.get("parentName"),
      contactNumber: formData.get("contactNumber"),
      admissionDate: formData.get("admissionDate"),
      level: formData.get("level"),
      notes: formData.get("notes") || undefined,
      medicalHistory: formData.get("medicalHistory") || undefined,
      registrationFee: formData.get("registrationFee") || undefined,
    };

    const parsed = createStudentSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    const dob = parseDateInput(parsed.data.dateOfBirth);
    const admission = parseDateInput(parsed.data.admissionDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (dob > today) {
      return {
        success: false,
        errors: { dateOfBirth: ["Date of birth must be in the past"] },
      };
    }

    const avatarFile = formData.get("avatar");
    const student = await createStudent({
      name: parsed.data.name,
      dateOfBirth: dob,
      gender: parsed.data.gender,
      parentName: parsed.data.parentName,
      contactNumber: parsed.data.contactNumber,
      admissionDate: admission,
      level: parsed.data.level,
      notes: parsed.data.notes,
      medicalHistory: parsed.data.medicalHistory,
      avatarFile:
        avatarFile instanceof File && avatarFile.size > 0 ? avatarFile : null,
      registrationFee: parsed.data.registrationFee,
    });

    revalidatePath("/admin/students");
    revalidatePath("/admin/dashboard");
    updateTag("students");
    updateTag("attendance");

    const next = formData.get("next") as string | null;
    if (next === "assign-plan") {
      redirect(`/admin/plans?student=${student.id}`);
    }

    return {
      success: true,
      message: "Student added successfully",
      studentId: student.id,
      studentName: student.name,
      studentNumber: student.studentNumber,
      avatarUrl: student.avatarUrl,
      gender: student.gender,
      registrationFee: student.registrationFee ?? undefined,
    };
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to create student",
    };
  }
}

export async function updateStudentAction(
  studentId: string,
  _prev: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}> {
  try {
    await assertCanManageStudents();

    const raw = {
      name: formData.get("name"),
      dateOfBirth: formData.get("dateOfBirth"),
      gender: formData.get("gender"),
      parentName: formData.get("parentName"),
      contactNumber: formData.get("contactNumber"),
      admissionDate: formData.get("admissionDate"),
      level: formData.get("level"),
      notes: formData.get("notes") || undefined,
      medicalHistory: formData.get("medicalHistory") || undefined,
      registrationFee: formData.get("registrationFee") || undefined,
    };

    const parsed = updateStudentSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    const dob = parseDateInput(parsed.data.dateOfBirth);
    const admission = parseDateInput(parsed.data.admissionDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (dob > today) {
      return {
        success: false,
        errors: { dateOfBirth: ["Date of birth must be in the past"] },
      };
    }

    const avatarFile = formData.get("avatar");
    await updateStudent(studentId, {
      name: parsed.data.name,
      dateOfBirth: dob,
      gender: parsed.data.gender,
      parentName: parsed.data.parentName,
      contactNumber: parsed.data.contactNumber,
      admissionDate: admission,
      level: parsed.data.level,
      notes: parsed.data.notes,
      medicalHistory: parsed.data.medicalHistory,
      avatarFile:
        avatarFile instanceof File && avatarFile.size > 0 ? avatarFile : null,
      registrationFee: parsed.data.registrationFee,
    });

    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/admin/students");
    revalidatePath("/admin/dashboard");
    updateTag("students");
    updateTag("attendance");

    redirect(`/admin/students/${studentId}`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to update student",
    };
  }
}

export async function updateStudentLevelAction(
  studentId: string,
  level: StudentLevel
): Promise<{ success: boolean; message?: string }> {
  try {
    await assertCanManageStudents();

    await updateStudentLevel(studentId, level);

    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/admin/students");
    revalidatePath("/admin/dashboard");
    updateTag("students");

    return { success: true, message: `Student level upgraded to ${level}` };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to update student level",
    };
  }
}

/** Used on the Plans page — student id comes from the form. */
export async function assignPlanFromPlansPageAction(
  _prev: unknown,
  formData: FormData
): Promise<{ success: boolean; message?: string; errors?: Record<string, string[]> }> {
  const studentId = formData.get("studentId");
  if (typeof studentId !== "string" || !studentId) {
    return { success: false, message: "Please select a student" };
  }
  return assignPlanAction(studentId, _prev, formData);
}

export async function assignPlanAction(
  studentId: string,
  _prev: unknown,
  formData: FormData
): Promise<{ success: boolean; message?: string; errors?: Record<string, string[]> }> {
  try {
    await assertCanManageStudents();

    const selectedDays = formData.getAll("selectedDays") as string[];

    const raw = {
      planType: formData.get("planType"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      selectedDays,
      discountPercent: formData.get("discountPercent") || "0",
      batchId: formData.get("batchId") || "",
    };

    const parsed = assignPlanSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    const { startDate, endDate } = parsePlanFormDates(
      parsed.data.startDate,
      parsed.data.endDate
    );

    const coachId = (formData.get("coachId") as string) || null;

    await assignPlanToStudent(studentId, {
      planType: parsed.data.planType,
      startDate,
      endDate,
      selectedDays: selectedDays as WeekdayName[],
      discountPercent: parsed.data.discountPercent,
      batchId: parsed.data.batchId || null,
      coachId: parsed.data.planType === "ONE_TO_ONE" ? (coachId || null) : null,
    });

    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/admin/students");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/plans");
    updateTag("students");
    updateTag("attendance");
    updateTag("batches");

    return { success: true, message: "Plan assigned successfully" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to assign plan",
    };
  }
}

export async function bulkImportStudentsAction(
  data: import("@/lib/services/students").BulkStudentPayload[]
): Promise<{ success: boolean; message?: string; importedCount?: number }> {
  try {
    await assertCanManageStudents();
    
    if (!data || data.length === 0) {
       return { success: false, message: "No valid data to import." };
    }

    const { bulkImportStudents } = await import("@/lib/services/students");
    const results = await bulkImportStudents(data);

    revalidatePath("/admin/students");
    revalidatePath("/admin/dashboard");
    updateTag("students");
    updateTag("attendance");
    updateTag("batches");

    return { success: true, message: "Bulk import completed successfully.", importedCount: results.length };
  } catch (e) {
    console.error("Bulk import error:", e);
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to import students",
    };
  }
}

export async function updateStudentActivePlanBatchAction(
  studentId: string,
  batchId: string | null
): Promise<{ success: boolean; message?: string }> {
  try {
    await assertCanManageStudents();

    await updateStudentActivePlanBatch(studentId, batchId);

    revalidatePath("/admin/students");
    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/admin/dashboard");
    updateTag("students");
    updateTag("batches");

    return { success: true, message: "Batch updated successfully" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to update batch",
    };
  }
}

export async function updateStudentActivePlanAction(
  studentId: string,
  _prev: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}> {
  try {
    await assertCanManageStudents();

    const studentPlanId = formData.get("studentPlanId");
    if (typeof studentPlanId !== "string" || !studentPlanId) {
      return { success: false, message: "No active plan found to update." };
    }

    const planType = formData.get("planType") as PlanType;
    const startDateRaw = formData.get("startDate") as string;
    const endDateRaw = formData.get("endDate") as string;
    const selectedDays = formData.getAll("selectedDays") as WeekdayName[];
    const discountPercent = parseFloat(formData.get("discountPercent") as string || "0") || 0;
    const batchId = (formData.get("batchId") as string) || null;
    const coachId = (formData.get("coachId") as string) || null;

    if (!startDateRaw || !endDateRaw) {
      return { success: false, message: "Start date and End date are required." };
    }

    const startDate = parseDateInput(startDateRaw);
    const endDate = parseDateInput(endDateRaw);

    if (endDate < startDate) {
      return { success: false, message: "End date must be after start date" };
    }

    if (selectedDays.length === 0) {
      return { success: false, message: "Please select at least one class day." };
    }

    // Fetch maps server-side for safe computation
    const { getPricingMaps } = await import("@/lib/services/pricing");
    const { getGracePeriodMap } = await import("@/lib/services/grace-periods");
    const [pricingMaps, gracePeriodMap] = await Promise.all([
      getPricingMaps(),
      getGracePeriodMap(),
    ]);

    await updateStudentActivePlan(studentPlanId, {
      planType,
      startDate,
      endDate,
      selectedDays,
      discountPercent,
      batchId: batchId || null,
      coachId: coachId || null,
      pricingMaps,
      gracePeriodMap,
    });

    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/admin/students");
    revalidatePath("/admin/dashboard");
    updateTag("students");
    updateTag("attendance");
    updateTag("batches");

    return { success: true, message: "Plan updated successfully" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to update plan",
    };
  }
}

export async function updateStudentNotesAndMedicalAction(
  studentId: string,
  data: { notes?: string | null; medicalHistory?: string | null }
): Promise<{ success: boolean; message?: string }> {
  try {
    await assertCanManageStudents();

    await updateStudentNotesAndMedical(studentId, data);

    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/admin/students");
    updateTag("students");

    return { success: true, message: "Notes and medical history updated successfully" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to update notes and medical history",
    };
  }
}

export async function generateStudentCredentialsAction(
  studentId: string
): Promise<{ success: boolean; message?: string; tempPassword?: string }> {
  try {
    await assertCanManageStudents();

    // Generate random 4-char uppercase alphanumeric string to append to "TAG-"
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let tempPassword = "TAG-";
    for (let i = 0; i < 4; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.student.update({
      where: { id: studentId },
      data: {
        password: hashedPassword,
        isTempPassword: true,
      },
    });

    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/admin/students");
    updateTag("students");

    return {
      success: true,
      message: "Credentials generated successfully",
      tempPassword,
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to generate credentials",
    };
  }
}

export async function changePortalPasswordAction(
  studentId: string,
  currentPassword?: string,
  newPassword?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await auth();
    if (!session) {
      throw new Error("Unauthorized");
    }

    const userRole = (session.user as any)?.role;
    const userId = (session.user as any)?.id;

    const isParent = userRole === "PARENT" && userId === studentId;
    const isStaff = userRole === "ADMIN" || userRole === "MANAGER";

    if (!isParent && !isStaff) {
      throw new Error("Unauthorized");
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: "New password must be at least 6 characters long" };
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { password: true, isTempPassword: true },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Only verify currentPassword if they are a parent, already have a password set, and are NOT on a temporary password
    if (isParent && student.password && !student.isTempPassword) {
      if (!currentPassword) {
        return { success: false, message: "Current password is required" };
      }
      const match = await bcrypt.compare(currentPassword, student.password);
      if (!match) {
        return { success: false, message: "Current password does not match" };
      }
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.student.update({
      where: { id: studentId },
      data: {
        password: hashed,
        isTempPassword: false,
      },
    });

    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/admin/students");
    revalidatePath("/portal");
    updateTag("students");

    return { success: true, message: "Password updated successfully" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to update password",
    };
  }
}

