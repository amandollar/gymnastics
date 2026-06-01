import { prisma } from "@/lib/prisma";
import type { PlanType } from "@prisma/client";
import {
  getDefaultPricingMaps,
  type PricingMaps,
} from "@/lib/plan/pricing-defaults";

export type { PricingMaps };

export async function getPricingMaps(): Promise<PricingMaps> {
  const maps = getDefaultPricingMaps();

  try {
    const rows = await prisma.sessionPricing.findMany();
    for (const row of rows) {
      const key = row.planType as keyof PricingMaps;
      if (row.daysPerWeek >= 1 && row.daysPerWeek <= 6) {
        maps[key][row.daysPerWeek] = row.pricePerSession;
      }
    }
  } catch {
    // Table may not exist yet during migration
  }

  return maps;
}

export async function savePricingMaps(
  updates: { planType: PlanType; daysPerWeek: number; pricePerSession: number }[]
) {
  for (const u of updates) {
    if (u.daysPerWeek < 1 || u.daysPerWeek > 6 || u.pricePerSession < 0) {
      throw new Error("Invalid pricing row");
    }
    await prisma.sessionPricing.upsert({
      where: {
        planType_daysPerWeek: {
          planType: u.planType,
          daysPerWeek: u.daysPerWeek,
        },
      },
      create: {
        planType: u.planType,
        daysPerWeek: u.daysPerWeek,
        pricePerSession: u.pricePerSession,
      },
      update: { pricePerSession: u.pricePerSession },
    });
  }
}
