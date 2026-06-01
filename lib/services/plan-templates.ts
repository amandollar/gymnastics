import { prisma } from "@/lib/prisma";
import type { PlanType } from "@prisma/client";

export async function listPlanTemplates() {
  return prisma.planTemplate.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createPlanTemplate(data: {
  name: string;
  planType: PlanType;
  durationMonths?: number;
  totalSessions?: number;
  validityDays?: number;
  defaultFee?: number;
  description?: string;
}) {
  return prisma.planTemplate.create({ data });
}

export async function deletePlanTemplate(id: string) {
  return prisma.planTemplate.delete({ where: { id } });
}
