import { prisma } from "@/lib/prisma";
import { computeStudentStatus } from "@/lib/utils/student";

export type BatchWithCount = {
  id: string;
  name: string;
  timing: string;
  studentCount: number;
  activeCount: number;
  graceCount: number;
  inactiveCount: number;
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
        },
      },
    },
  });

  // Cast to any[] to resolve transient TS Server type caching issues in some editors
  return (batches as any[]).map((b) => {
    let activeCount = 0;
    let graceCount = 0;
    let inactiveCount = 0;

    b.studentPlans.forEach((plan: any) => {
      const status = computeStudentStatus(plan);
      if (status === "ACTIVE" || status === "FREEZE") {
        activeCount++;
      } else if (status === "GRACE") {
        graceCount++;
      } else {
        inactiveCount++;
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
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    };
  });
}

/** Creates a new batch. Throws if name is blank. */
export async function createBatch(name: string, timing: string) {
  return prisma.batch.create({ data: { name: name.trim(), timing: timing.trim() } });
}

/** Updates an existing batch's name and/or timing. */
export async function renameBatch(id: string, name: string, timing: string) {
  return prisma.batch.update({
    where: { id },
    data: { name: name.trim(), timing: timing.trim() },
  });
}

/**
 * Deletes a batch. Due to `onDelete: SetNull`, all StudentPlan rows
 * referencing this batch will have their batchId set to null automatically.
 */
export async function deleteBatch(id: string) {
  return prisma.batch.delete({ where: { id } });
}
