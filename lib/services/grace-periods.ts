import { prisma } from "@/lib/prisma";
import {
  gracePeriodKey,
  type GracePeriodMap,
} from "@/lib/plan/grace-period-utils";

export {
  gracePeriodKey,
  computeDefaultGraceDays,
  lookupGraceDays,
} from "@/lib/plan/grace-period-utils";
export type { GracePeriodMap } from "@/lib/plan/grace-period-utils";

/** Fetch all grace period settings from DB; returns a populated map. */
export async function getGracePeriodMap(): Promise<GracePeriodMap> {
  const map: GracePeriodMap = {};
  try {
    const rows = await prisma.gracePeriodSettings.findMany();
    for (const row of rows) {
      map[gracePeriodKey(row.sessionsPerWeek, row.planMonths)] = row.graceDays;
    }
  } catch {
    // Table may not exist yet during migration — return empty (uses formula fallback)
  }
  return map;
}

/** Persist grace period settings. Admin-only — caller must assert auth. */
export async function saveGracePeriodMap(
  updates: { sessionsPerWeek: number; planMonths: number; graceDays: number }[]
): Promise<void> {
  for (const u of updates) {
    if (u.graceDays < 0) throw new Error("Grace days cannot be negative");
    await prisma.gracePeriodSettings.upsert({
      where: {
        sessionsPerWeek_planMonths: {
          sessionsPerWeek: u.sessionsPerWeek,
          planMonths: u.planMonths,
        },
      },
      create: {
        sessionsPerWeek: u.sessionsPerWeek,
        planMonths: u.planMonths,
        graceDays: u.graceDays,
      },
      update: { graceDays: u.graceDays },
    });
  }
}
