import { prisma } from "@/lib/prisma";
import type { PlanType, Prisma } from "@prisma/client";
import {
  computePlanFields,
  type WeekdayName,
} from "@/lib/plan/calculations";
import {
  computeStudentStatus,
  parseDateInput,
  type StudentStatus,
} from "@/lib/utils/student";
import { uploadStudentAvatarToCloudinary } from "@/lib/avatar/cloudinary";
import { getGracePeriodMap } from "@/lib/services/grace-periods";

export async function getNextStudentNumber(): Promise<number> {
  const result = await prisma.student.aggregate({
    _max: { studentNumber: true },
  });
  return (result._max.studentNumber ?? 0) + 1;
}

export type StudentWithActivePlan = Awaited<
  ReturnType<typeof getStudentById>
>;

function mapStudentRow(
  student: Prisma.StudentGetPayload<{
    include: {
      plans: { where: { isActive: true }; take: 1 };
    };
  }>
) {
  const activePlan = student.plans[0] ?? null;
  const status = computeStudentStatus(
    activePlan
      ? {
          sessionsCompleted: activePlan.sessionsCompleted,
          totalSessions: activePlan.totalSessions,
          endDate: activePlan.endDate,
          expiryDate: activePlan.expiryDate,
          freezeStartDate: activePlan.freezeStartDate,
          freezeEndDate: activePlan.freezeEndDate,
        }
      : null
  );

  return {
    ...student,
    activePlan,
    status,
    sessionsPending: activePlan
      ? Math.max(0, activePlan.totalSessions - activePlan.sessionsCompleted)
      : null,
  };
}

export async function listStudents(filters?: {
  search?: string;
  status?: StudentStatus | "ALL";
}) {
  const students = await prisma.student.findMany({
    orderBy: { studentNumber: "asc" },
    include: {
      plans: {
        where: { isActive: true },
        take: 1,
      },
    },
  });

  let rows = students.map(mapStudentRow);

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q) ||
        s.contactNumber.includes(q) ||
        String(s.studentNumber).includes(q)
    );
  }

  if (filters?.status && filters.status !== "ALL") {
    rows = rows.filter((s) => s.status === filters.status);
  }

  return rows;
}

export async function getStudentById(id: string) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      plans: {
        orderBy: { createdAt: "desc" },
      },
      attendances: {
        orderBy: { date: "asc" },
        select: { id: true, date: true, studentPlanId: true },
      },
    },
  });

  if (!student) return null;

  const activePlan = student.plans.find((p) => p.isActive) ?? null;
  const status = computeStudentStatus(
    activePlan
      ? {
          sessionsCompleted: activePlan.sessionsCompleted,
          totalSessions: activePlan.totalSessions,
          endDate: activePlan.endDate,
          expiryDate: activePlan.expiryDate,
          freezeStartDate: activePlan.freezeStartDate,
          freezeEndDate: activePlan.freezeEndDate,
        }
      : null
  );

  return {
    ...student,
    activePlan,
    status,
    sessionsPending: activePlan
      ? Math.max(0, activePlan.totalSessions - activePlan.sessionsCompleted)
      : null,
  };
}

export async function createStudent(data: {
  name: string;
  dateOfBirth: Date;
  gender: string;
  parentName: string;
  contactNumber: string;
  admissionDate: Date;
  notes?: string;
  medicalHistory?: string;
  avatarFile?: File | null;
}) {
  const studentNumber = await getNextStudentNumber();

  const student = await prisma.student.create({
    data: {
      studentNumber,
      name: data.name,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      parentName: data.parentName,
      contactNumber: data.contactNumber,
      admissionDate: data.admissionDate,
      notes: data.notes,
      medicalHistory: data.medicalHistory,
      avatarUrl: null,
    },
  });

  if (data.avatarFile && data.avatarFile.size > 0) {
    const uploadedUrl = await uploadStudentAvatarToCloudinary(
      student.id,
      data.avatarFile
    );
    return prisma.student.update({
      where: { id: student.id },
      data: { avatarUrl: uploadedUrl },
    });
  }

  return student;
}

export async function updateStudent(
  id: string,
  data: {
    name: string;
    dateOfBirth: Date;
    gender: string;
    parentName: string;
    contactNumber: string;
    admissionDate: Date;
    notes?: string;
    medicalHistory?: string;
    avatarFile?: File | null;
  }
) {
  const student = await prisma.student.update({
    where: { id },
    data: {
      name: data.name,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      parentName: data.parentName,
      contactNumber: data.contactNumber,
      admissionDate: data.admissionDate,
      notes: data.notes ?? null,
      medicalHistory: data.medicalHistory ?? null,
    },
  });

  if (data.avatarFile && data.avatarFile.size > 0) {
    const uploadedUrl = await uploadStudentAvatarToCloudinary(
      student.id,
      data.avatarFile
    );
    return prisma.student.update({
      where: { id: student.id },
      data: { avatarUrl: uploadedUrl },
    });
  }

  return student;
}

export async function assignPlanToStudent(
  studentId: string,
  input: {
    planType: PlanType;
    startDate: Date;
    endDate: Date;
    selectedDays: WeekdayName[];
    discountPercent: number;
  }
) {
  if (input.endDate < input.startDate) {
    throw new Error("End date must be after start date");
  }

  const { getPricingMaps } = await import("@/lib/services/pricing");
  const [pricingMaps, gracePeriodMap] = await Promise.all([
    getPricingMaps(),
    getGracePeriodMap(),
  ]);

  const computed = computePlanFields({
    planType: input.planType,
    startDate: input.startDate,
    endDate: input.endDate,
    selectedDays: input.selectedDays,
    discountPercent: input.discountPercent,
    pricingMaps,
    gracePeriodMap,
  });

  if (computed.totalSessions === 0) {
    throw new Error("No sessions fall in the selected date range and days");
  }

  return prisma.$transaction(async (tx) => {
    await tx.studentPlan.updateMany({
      where: { studentId, isActive: true },
      data: { isActive: false },
    });

    return tx.studentPlan.create({
      data: {
        studentId,
        planType: input.planType,
        startDate: input.startDate,
        endDate: input.endDate,
        selectedDays: input.selectedDays,
        sessionsPerWeek: computed.sessionsPerWeek,
        discountPercent: computed.discountPercent,
        totalSessions: computed.totalSessions,
        validityDays: computed.graceDays,
        graceDays: computed.graceDays,
        expiryDate: computed.expiryDate,
        fee: computed.fee,
        pricePerSession: computed.pricePerSession,
        planMonths: computed.planMonths,
        isActive: true,
      },
    });
  });
}

/**
 * Apply a holiday freeze to a student's active plan.
 * The plan's endDate and expiryDate are extended by the freeze duration.
 * During the freeze window, status = FREEZE.
 */
export async function freezeStudentPlan(
  studentPlanId: string,
  freezeStart: Date,
  freezeEnd: Date
): Promise<void> {
  if (freezeEnd < freezeStart) {
    throw new Error("Freeze end date must be after freeze start date");
  }

  const plan = await prisma.studentPlan.findUnique({
    where: { id: studentPlanId },
    select: { endDate: true, expiryDate: true, graceDays: true },
  });
  if (!plan) throw new Error("Plan not found");

  // Compute extension duration in days
  const freezeDurationMs = freezeEnd.getTime() - freezeStart.getTime();
  const freezeDurationDays = Math.ceil(freezeDurationMs / 86400000);

  // Extend endDate and expiryDate by the freeze duration
  const newEndDate = new Date(plan.endDate);
  newEndDate.setDate(newEndDate.getDate() + freezeDurationDays);

  const newExpiryDate = new Date(newEndDate);
  newExpiryDate.setDate(newExpiryDate.getDate() + plan.graceDays);

  await prisma.studentPlan.update({
    where: { id: studentPlanId },
    data: {
      freezeStartDate: freezeStart,
      freezeEndDate: freezeEnd,
      endDate: newEndDate,
      expiryDate: newExpiryDate,
    },
  });
}

/** Remove an active freeze from a student plan (keeping extended dates). */
export async function unfreezeStudentPlan(
  studentPlanId: string
): Promise<void> {
  await prisma.studentPlan.update({
    where: { id: studentPlanId },
    data: {
      freezeStartDate: null,
      freezeEndDate: null,
    },
  });
}

export function parsePlanFormDates(start: string, end: string) {
  return {
    startDate: parseDateInput(start),
    endDate: parseDateInput(end),
  };
}

export interface BulkStudentPayload {
  name: string;
  dateOfBirth: Date;
  gender: string;
  parentName: string;
  contactNumber: string;
  admissionDate: Date;
  plan: {
    planType: PlanType;
    startDate: Date;
    endDate: Date;
    totalSessions: number;
    fee: number;
    sessionsCompleted: number;
  } | null;
  attendances: Date[];
}

import { randomUUID } from "crypto";

export async function bulkImportStudents(students: BulkStudentPayload[]) {
  const currentStudentNumberRes = await prisma.student.aggregate({
    _max: { studentNumber: true },
  });
  let currentStudentNumber = currentStudentNumberRes._max.studentNumber ?? 0;

  const studentsToCreate = [];
  const plansToCreate = [];
  const attendancesToCreate = [];
  const results = [];

  for (const data of students) {
    currentStudentNumber++;
    const studentId = randomUUID();

    studentsToCreate.push({
      id: studentId,
      studentNumber: currentStudentNumber,
      name: data.name,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender || "Other",
      parentName: data.parentName,
      contactNumber: data.contactNumber,
      admissionDate: data.admissionDate,
    });

    results.push({ id: studentId, name: data.name });

    if (data.plan) {
      const planId = randomUUID();
      // For bulk imports, compute validityDays as 0 (no grace for historical data)
      const pricePerSession =
        data.plan.totalSessions > 0
          ? Math.round(data.plan.fee / data.plan.totalSessions)
          : 0;

      plansToCreate.push({
        id: planId,
        studentId: studentId,
        planType: data.plan.planType,
        startDate: data.plan.startDate,
        endDate: data.plan.endDate,
        selectedDays: [],
        sessionsPerWeek: 0,
        discountPercent: 0,
        totalSessions: data.plan.totalSessions,
        validityDays: 0,
        graceDays: 0,
        expiryDate: data.plan.endDate,
        fee: data.plan.fee,
        pricePerSession,
        sessionsCompleted: data.plan.sessionsCompleted,
        isActive: true,
      });

      if (data.attendances && data.attendances.length > 0) {
        const uniqueDates = Array.from(
          new Set(data.attendances.map((d) => d.toISOString().split("T")[0]))
        );
        for (const dateStr of uniqueDates) {
          attendancesToCreate.push({
            studentId: studentId,
            studentPlanId: planId,
            date: new Date(dateStr),
          });
        }
      }
    }
  }

  await prisma.$transaction([
    prisma.student.createMany({ data: studentsToCreate, skipDuplicates: true }),
    ...(plansToCreate.length > 0
      ? [
          prisma.studentPlan.createMany({
            data: plansToCreate,
            skipDuplicates: true,
          }),
        ]
      : []),
    ...(attendancesToCreate.length > 0
      ? [
          prisma.attendance.createMany({
            data: attendancesToCreate,
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);

  return results;
}
