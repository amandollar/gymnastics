import { prisma } from "@/lib/prisma";

export type BatchWithCount = {
  id: string;
  name: string;
  timing: string;
  studentCount: number;
  createdAt: Date;
  updatedAt: Date;
};

/** Returns all batches ordered by creation date, with the count of currently-active student plans assigned to each. */
export async function listBatches(): Promise<BatchWithCount[]> {
  const batches = await prisma.batch.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: { studentPlans: { where: { isActive: true } } },
      },
    },
  });

  return batches.map((b) => ({
    id: b.id,
    name: b.name,
    timing: b.timing,
    studentCount: b._count.studentPlans,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  }));
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
