"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  assignPlanToStudent,
  createStudent,
  updateStudent,
  parsePlanFormDates,
} from "@/lib/services/students";
import { createStudentSchema, updateStudentSchema, assignPlanSchema } from "@/lib/validations/student";
import type { WeekdayName } from "@/lib/plan/calculations";
import { parseDateInput } from "@/lib/utils/student";

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
      notes: formData.get("notes") || undefined,
      medicalHistory: formData.get("medicalHistory") || undefined,
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
      notes: parsed.data.notes,
      medicalHistory: parsed.data.medicalHistory,
      avatarFile:
        avatarFile instanceof File && avatarFile.size > 0 ? avatarFile : null,
    });

    revalidatePath("/students");
    revalidatePath("/dashboard");

    const next = formData.get("next") as string | null;
    if (next === "assign-plan") {
      redirect(`/plans?student=${student.id}`);
    }

    return {
      success: true,
      message: "Student added successfully",
      studentId: student.id,
      studentName: student.name,
      studentNumber: student.studentNumber,
      avatarUrl: student.avatarUrl,
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
      notes: formData.get("notes") || undefined,
      medicalHistory: formData.get("medicalHistory") || undefined,
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
      notes: parsed.data.notes,
      medicalHistory: parsed.data.medicalHistory,
      avatarFile:
        avatarFile instanceof File && avatarFile.size > 0 ? avatarFile : null,
    });

    revalidatePath(`/students/${studentId}`);
    revalidatePath("/students");
    revalidatePath("/dashboard");

    redirect(`/students/${studentId}`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to update student",
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
    };

    const parsed = assignPlanSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    const { startDate, endDate } = parsePlanFormDates(
      parsed.data.startDate,
      parsed.data.endDate
    );

    await assignPlanToStudent(studentId, {
      planType: parsed.data.planType,
      startDate,
      endDate,
      selectedDays: selectedDays as WeekdayName[],
      discountPercent: parsed.data.discountPercent,
    });

    revalidatePath(`/students/${studentId}`);
    revalidatePath("/students");
    revalidatePath("/dashboard");
    revalidatePath("/plans");

    return { success: true, message: "Plan assigned successfully" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to assign plan",
    };
  }
}
