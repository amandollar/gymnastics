import { prisma } from "@/lib/prisma";
import type { PlanType, Prisma, StudentLevel } from "@prisma/client";
import {
  computePlanFields,
  startOfDay,
  type WeekdayName,
} from "@/lib/plan/calculations";
import {
  computeStudentStatus,
  parseDateInput,
  type StudentStatus,
} from "@/lib/utils/student";
import { uploadStudentAvatarToCloudinary } from "@/lib/avatar/cloudinary";
import { getGracePeriodMap } from "@/lib/services/grace-periods";
import { randomUUID } from "crypto";

export async function getNextStudentNumber(): Promise<number> {
  const result = await prisma.student.aggregate({
    _max: { studentNumber: true },
  });
  return (result._max.studentNumber ?? 0) + 1;
}


async function allocateStudentNumber(transaction: Pick<typeof prisma, "student" | "$executeRaw">) {
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(617901231)`;
  const result = await transaction.student.aggregate({
    _max: { studentNumber: true },
  });
  return (result._max.studentNumber ?? 0) + 1;
}

export type StudentWithActivePlan = Awaited<
  ReturnType<typeof getStudentById>
>;

function mapStudentRow(student: any) {
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
          freezePeriods: activePlan.freezePeriods,
          lastAttendanceDate: activePlan.attendances?.[0]?.date ?? null,
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
  const searchQuery = filters?.search?.trim();

  const students = await (prisma as any).student.findMany({
    orderBy: { studentNumber: "asc" },
    where: searchQuery
      ? {
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" } },
            // studentNumber is Int â€” only add this clause when the query is numeric
            ...(isNaN(Number(searchQuery))
              ? []
              : [{ studentNumber: { equals: Number(searchQuery) } }]),
          ],
        }
      : undefined,
    include: {
      plans: {
        where: { isActive: true },
        take: 1,
        include: {
          freezePeriods: true,
          payments: {
            select: { amount: true },
          },
          attendances: {
            orderBy: { date: "desc" },
            take: 1,
            select: { date: true },
          },
        },
      },
    },
  });

  let rows = (students as any[]).map(mapStudentRow);

  // Status is computed from plan dates â€” keep this in-memory filter since it
  // depends on `computeStudentStatus()` logic that runs post-query.
  if (filters?.status && filters.status !== "ALL") {
    rows = rows.filter((s) => s.status === filters.status);
  }

  return rows;
}


export async function getStudentById(id: string) {
  const student = await (prisma as any).student.findUnique({
    where: { id },
    include: {
      plans: {
        orderBy: { createdAt: "desc" },
        include: {
          batch: true,
          coach: true,
          freezePeriods: {
            orderBy: { startDate: "asc" },
          },
          payments: {
            select: { amount: true },
          },
        },
      },
      attendances: {
        orderBy: { date: "asc" },
        select: { id: true, date: true, studentPlanId: true },
      },
      payments: {
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
      },
    },
  });

  if (!student) return null;

  // Enrich plans with paidAmount + outstanding
  const plans = (student.plans as any[]).map((plan: any) => {
    const paidAmount = (plan.payments as { amount: number }[]).reduce(
      (sum, p) => sum + p.amount,
      0
    );
    const outstanding = Math.max(0, plan.fee - paidAmount);
    return { ...plan, paidAmount, outstanding };
  });

  const activePlan = plans.find((p: any) => p.isActive) ?? null;
  const activePlanAttendances = activePlan
    ? student.attendances.filter((a: any) => a.studentPlanId === activePlan.id)
    : [];
  const lastAttendanceDate = activePlanAttendances.length > 0
    ? activePlanAttendances[activePlanAttendances.length - 1].date
    : null;

  const status = computeStudentStatus(
    activePlan
      ? {
          sessionsCompleted: activePlan.sessionsCompleted,
          totalSessions: activePlan.totalSessions,
          endDate: activePlan.endDate,
          expiryDate: activePlan.expiryDate,
          freezeStartDate: activePlan.freezeStartDate,
          freezeEndDate: activePlan.freezeEndDate,
          freezePeriods: activePlan.freezePeriods,
          lastAttendanceDate,
        }
      : null
  );

  // Enrich batch with live student counts so the PlanCard can display them
  let enrichedActivePlan = activePlan;
  if (activePlan?.batch?.id) {
    const batchPlans = await (prisma as any).studentPlan.findMany({
      where: { batchId: activePlan.batch.id, isActive: true },
      select: {
        sessionsCompleted: true,
        totalSessions: true,
        endDate: true,
        expiryDate: true,
        freezeStartDate: true,
        freezeEndDate: true,
        freezePeriods: { select: { startDate: true, endDate: true } },
        attendances: {
          orderBy: { date: "desc" },
          take: 1,
          select: { date: true },
        },
      },
    }) as any[];
    let activeCount = 0, graceCount = 0, inactiveCount = 0;
    for (const bp of batchPlans) {
      const s = computeStudentStatus({
        ...bp,
        lastAttendanceDate: bp.attendances?.[0]?.date ?? null,
      });
      if (s === "ACTIVE" || s === "FREEZE") activeCount++;
      else if (s === "GRACE") graceCount++;
      else if (s === "INACTIVE") inactiveCount++;
    }
    enrichedActivePlan = {
      ...activePlan,
      batch: {
        ...(activePlan.batch as any),
        studentCount: batchPlans.length,
        activeCount,
        graceCount,
        inactiveCount,
      },
    };
  }

  return {
    ...student,
    plans,
    activePlan: enrichedActivePlan,
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
  level: StudentLevel;
  notes?: string;
  medicalHistory?: string;
  avatarFile?: File | null;
  registrationFee?: number;
}) {
  const student = await prisma.$transaction(async (transaction) => {
    const studentNumber = await allocateStudentNumber(transaction);

    return transaction.student.create({
      data: {
        studentNumber,
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        parentName: data.parentName,
        contactNumber: data.contactNumber,
        admissionDate: data.admissionDate,
        level: data.level,
        notes: data.notes,
        medicalHistory: data.medicalHistory,
        avatarUrl: null,
        registrationFee: data.registrationFee,
      },
    });
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
    level: StudentLevel;
    notes?: string;
    medicalHistory?: string;
    avatarFile?: File | null;
    registrationFee?: number;
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
      level: data.level,
      notes: data.notes ?? null,
      medicalHistory: data.medicalHistory ?? null,
      registrationFee: data.registrationFee ?? null,
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

export async function updateStudentLevel(id: string, level: StudentLevel) {
  return prisma.student.update({
    where: { id },
    data: { level },
  });
}

export async function updateStudentNotesAndMedical(
  id: string,
  data: { notes?: string | null; medicalHistory?: string | null; trainingFocus?: string | null }
) {
  const updateData: any = {};
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.medicalHistory !== undefined) updateData.medicalHistory = data.medicalHistory;
  if (data.trainingFocus !== undefined) updateData.trainingFocus = data.trainingFocus;

  return prisma.student.update({
    where: { id },
    data: updateData,
  });
}

export async function assignPlanToStudent(
  studentId: string,
  input: {
    planType: PlanType;
    startDate: Date;
    endDate: Date;
    selectedDays: WeekdayName[];
    discountPercent: number;
    batchId?: string | null;
    coachId?: string | null;
    commissionPercent?: number;
  }
) {
  if (input.endDate < input.startDate) {
    throw new Error("End date must be after start date");
  }

  // Check for overlapping plans
  const overlapping = await prisma.studentPlan.findFirst({
    where: {
      studentId,
      startDate: { lte: input.endDate },
      endDate: { gte: input.startDate },
    },
    select: { id: true, startDate: true, endDate: true },
  });
  if (overlapping) {
    const endStr = new Date(overlapping.endDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    throw new Error(
      `This student already has a plan that overlaps these dates. The existing plan ends on ${endStr}. Please start the new plan after that date.`
    );
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
        batchId: input.batchId ?? null,
        coachId: input.coachId ?? null,
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
        commissionPercent: input.planType === "ONE_TO_ONE" ? (input.commissionPercent ?? 50) : 50,
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

  // Compute extension duration in days (inclusive)
  const freezeDurationMs = freezeEnd.getTime() - freezeStart.getTime();
  const freezeDurationDays = Math.ceil(freezeDurationMs / 86400000) + 1;

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

/** Remove an active freeze from a student plan, symmetrically reducing the dates. */
export async function unfreezeStudentPlan(
  studentPlanId: string
): Promise<void> {
  const plan = await prisma.studentPlan.findUnique({
    where: { id: studentPlanId },
    select: { freezeStartDate: true, freezeEndDate: true, endDate: true, expiryDate: true },
  });
  if (!plan) throw new Error("Plan not found");

  if (!plan.freezeStartDate || !plan.freezeEndDate) {
    // Already unfrozen, just clear (safety fallback)
    await prisma.studentPlan.update({
      where: { id: studentPlanId },
      data: {
        freezeStartDate: null,
        freezeEndDate: null,
      },
    });
    return;
  }

  // Compute extension duration in days (inclusive)
  const freezeDurationMs = plan.freezeEndDate.getTime() - plan.freezeStartDate.getTime();
  const freezeDurationDays = Math.ceil(freezeDurationMs / 86400000) + 1;

  // Reduce endDate and expiryDate by the freeze duration
  const newEndDate = new Date(plan.endDate);
  newEndDate.setDate(newEndDate.getDate() - freezeDurationDays);

  const newExpiryDate = new Date(plan.expiryDate);
  newExpiryDate.setDate(newExpiryDate.getDate() - freezeDurationDays);

  await prisma.studentPlan.update({
    where: { id: studentPlanId },
    data: {
      freezeStartDate: null,
      freezeEndDate: null,
      endDate: newEndDate,
      expiryDate: newExpiryDate,
    },
  });
}

/** Update the active plan's batch for a student. */
export async function updateStudentActivePlanBatch(
  studentId: string,
  batchId: string | null
) {
  const activePlan = await prisma.studentPlan.findFirst({
    where: { studentId, isActive: true },
  });
  if (!activePlan) {
    throw new Error("No active plan found for this student. Please assign a plan first.");
  }
  return prisma.studentPlan.update({
    where: { id: activePlan.id },
    data: { batchId },
  });
}

export async function updateStudentActivePlan(
  studentPlanId: string,
  data: {
    planType: PlanType;
    startDate: Date;
    endDate: Date;
    selectedDays: WeekdayName[];
    discountPercent: number;
    batchId?: string | null;
    coachId?: string | null;
    commissionPercent?: number;
    pricingMaps: any;
    gracePeriodMap: any;
  }
) {
  const computed = computePlanFields({
    planType: data.planType,
    startDate: data.startDate,
    endDate: data.endDate,
    selectedDays: data.selectedDays,
    discountPercent: data.discountPercent,
    pricingMaps: data.pricingMaps,
    gracePeriodMap: data.gracePeriodMap,
  });

  return prisma.studentPlan.update({
    where: { id: studentPlanId },
    data: {
      planType: data.planType,
      startDate: data.startDate,
      endDate: data.endDate,
      selectedDays: data.selectedDays,
      sessionsPerWeek: computed.sessionsPerWeek,
      discountPercent: computed.discountPercent,
      totalSessions: computed.totalSessions,
      validityDays: computed.graceDays,
      graceDays: computed.graceDays,
      expiryDate: computed.expiryDate,
      fee: computed.fee,
      pricePerSession: computed.pricePerSession,
      planMonths: computed.planMonths,
      batchId: data.planType === "REGULAR" ? data.batchId : null,
      coachId: data.planType === "ONE_TO_ONE" ? data.coachId : null,
      commissionPercent: data.planType === "ONE_TO_ONE" ? (data.commissionPercent ?? 50) : 50,
    },
  });
}

export async function addFreezePeriod(
  studentPlanId: string,
  startDate: Date,
  endDate: Date
): Promise<void> {
  if (endDate < startDate) {
    throw new Error("Freeze end date must be after freeze start date");
  }

  const plan = await prisma.studentPlan.findUnique({
    where: { id: studentPlanId },
    include: { freezePeriods: true },
  });
  if (!plan) throw new Error("Plan not found");
  if (!plan.isActive) throw new Error("Plan is not active");

  const pStart = startOfDay(new Date(plan.startDate));
  const pEnd = startOfDay(new Date(plan.endDate));
  const fStart = startOfDay(new Date(startDate));
  const fEnd = startOfDay(new Date(endDate));

  if (fStart < pStart || fEnd > pEnd) {
    throw new Error("Freeze dates must be within the active plan window");
  }

  for (const fp of plan.freezePeriods) {
    const existingStart = startOfDay(new Date(fp.startDate));
    const existingEnd = startOfDay(new Date(fp.endDate));
    if (fStart <= existingEnd && fEnd >= existingStart) {
      throw new Error("Freeze period overlaps with an existing freeze period");
    }
  }

  const durationMs = endDate.getTime() - startDate.getTime();
  const durationDays = Math.ceil(durationMs / 86400000) + 1;

  const newEndDate = new Date(plan.endDate);
  newEndDate.setDate(newEndDate.getDate() + durationDays);

  const newExpiryDate = new Date(plan.expiryDate);
  newExpiryDate.setDate(newExpiryDate.getDate() + durationDays);

  await prisma.$transaction([
    prisma.freezePeriod.create({
      data: {
        studentPlanId,
        startDate,
        endDate,
      },
    }),
    prisma.studentPlan.update({
      where: { id: studentPlanId },
      data: {
        endDate: newEndDate,
        expiryDate: newExpiryDate,
      },
    }),
  ]);
}

export async function deleteFreezePeriod(
  freezePeriodId: string
): Promise<void> {
  const freezePeriod = await prisma.freezePeriod.findUnique({
    where: { id: freezePeriodId },
    include: { studentPlan: true },
  });
  if (!freezePeriod) throw new Error("Freeze period not found");

  const plan = freezePeriod.studentPlan;

  const durationMs = freezePeriod.endDate.getTime() - freezePeriod.startDate.getTime();
  const durationDays = Math.ceil(durationMs / 86400000) + 1;

  const newEndDate = new Date(plan.endDate);
  newEndDate.setDate(newEndDate.getDate() - durationDays);

  const newExpiryDate = new Date(plan.expiryDate);
  newExpiryDate.setDate(newExpiryDate.getDate() - durationDays);

  await prisma.$transaction([
    prisma.freezePeriod.delete({
      where: { id: freezePeriodId },
    }),
    prisma.studentPlan.update({
      where: { id: plan.id },
      data: {
        endDate: newEndDate,
        expiryDate: newExpiryDate,
      },
    }),
  ]);
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


export async function bulkImportStudents(students: BulkStudentPayload[]) {
  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(617901231)`;

    const currentStudentNumberRes = await transaction.student.aggregate({
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

    await transaction.student.createMany({ data: studentsToCreate, skipDuplicates: true });
    if (plansToCreate.length > 0) {
      await transaction.studentPlan.createMany({
        data: plansToCreate,
        skipDuplicates: true,
      });
    }
    if (attendancesToCreate.length > 0) {
      await transaction.attendance.createMany({
        data: attendancesToCreate,
        skipDuplicates: true,
      });
    }

    return results;
  });
}


