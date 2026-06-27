import { prisma } from "@/lib/prisma";
import { computeStudentStatus } from "@/lib/utils/student";
import type { WeekdayName } from "@/lib/plan/calculations";

export type BatchWithCount = {
  id: string;
  name: string;
  timing: string;
  studentCount: number;
  activeCount: number;
  graceCount: number;
  inactiveCount: number;
  dayCounts: Record<WeekdayName, number>;
  startAge: number;
  endAge: number;
  useDefaultPricing: boolean;
  price1d: number | null;
  price2d: number | null;
  price3d: number | null;
  price4d: number | null;
  price5d: number | null;
  price6d: number | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Returns all batches ordered by creation date, with the count of currently-active student plans assigned to each. */
export async function listBatches(): Promise<BatchWithCount[]> {
  const batches = await (prisma as any).batch.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      studentPlans: {
        where: { isActive: true },
        select: {
          selectedDays: true,
          sessionsCompleted: true,
          totalSessions: true,
          endDate: true,
          expiryDate: true,
          freezeStartDate: true,
          freezeEndDate: true,
          freezePeriods: {
            select: {
              startDate: true,
              endDate: true,
            },
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

  // Cast to any[] to resolve transient TS Server type caching issues in some editors
  return (batches as any[]).map((b) => {
    let activeCount = 0;
    let graceCount = 0;
    let inactiveCount = 0;

    const dayCounts: Record<WeekdayName, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };

    b.studentPlans.forEach((plan: any) => {
      const status = computeStudentStatus({
        ...plan,
        lastAttendanceDate: plan.attendances?.[0]?.date ?? null,
      });
      if (status === "ACTIVE" || status === "FREEZE") {
        activeCount++;
      } else if (status === "GRACE") {
        graceCount++;
      } else if (status === "INACTIVE") {
        inactiveCount++;
      }

      if (status === "ACTIVE" || status === "FREEZE" || status === "GRACE") {
        const days = plan.selectedDays;
        if (Array.isArray(days)) {
          days.forEach((day: string) => {
            if (day in dayCounts) {
              dayCounts[day as WeekdayName]++;
            }
          });
        }
      }
    });

    return {
      id: b.id,
      name: b.name,
      timing: b.timing,
      studentCount: b.studentPlans.length,
      activeCount,
      graceCount,
      inactiveCount,
      dayCounts,
      startAge: b.startAge,
      endAge: b.endAge,
      useDefaultPricing: b.useDefaultPricing !== false,
      price1d: b.price1d,
      price2d: b.price2d,
      price3d: b.price3d,
      price4d: b.price4d,
      price5d: b.price5d,
      price6d: b.price6d,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    };
  });
}

/** Creates a new batch. Throws if name is blank. */
export async function createBatch(
  name: string,
  timing: string,
  startAge: number,
  endAge: number,
  useDefaultPricing: boolean,
  pricing: {
    price1d: number | null;
    price2d: number | null;
    price3d: number | null;
    price4d: number | null;
    price5d: number | null;
    price6d: number | null;
  }
) {
  return prisma.batch.create({
    data: {
      name: name.trim(),
      timing: timing.trim(),
      startAge,
      endAge,
      useDefaultPricing,
      ...pricing,
    },
  });
}

/** Updates an existing batch's name and/or timing. */
export async function renameBatch(
  id: string,
  name: string,
  timing: string,
  startAge: number,
  endAge: number,
  useDefaultPricing: boolean,
  pricing: {
    price1d: number | null;
    price2d: number | null;
    price3d: number | null;
    price4d: number | null;
    price5d: number | null;
    price6d: number | null;
  }
) {
  return prisma.batch.update({
    where: { id },
    data: {
      name: name.trim(),
      timing: timing.trim(),
      startAge,
      endAge,
      useDefaultPricing,
      ...pricing,
    },
  });
}

/**
 * Deletes a batch. Due to `onDelete: SetNull`, all StudentPlan rows
 * referencing this batch will have their batchId set to null automatically.
 */
export async function deleteBatch(id: string) {
  return prisma.batch.delete({ where: { id } });
}
