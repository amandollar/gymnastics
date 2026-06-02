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
          expiryDate: activePlan.expiryDate,
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
          expiryDate: activePlan.expiryDate,
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
  const pricingMaps = await getPricingMaps();

  const computed = computePlanFields({
    planType: input.planType,
    startDate: input.startDate,
    endDate: input.endDate,
    selectedDays: input.selectedDays,
    discountPercent: input.discountPercent,
    pricingMaps,
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
        validityDays: computed.validityDays,
        expiryDate: computed.expiryDate,
        fee: computed.fee,
        pricePerSession: computed.pricePerSession,
        planMonths: computed.planMonths,
        isActive: true,
      },
    });
  });
}

export function parsePlanFormDates(start: string, end: string) {
  return {
    startDate: parseDateInput(start),
    endDate: parseDateInput(end),
  };
}
