"use server";

import { auth } from "@/auth";
import { revalidatePath, updateTag } from "next/cache";
import { savePricingMaps } from "@/lib/services/pricing";
import { saveGracePeriodMap } from "@/lib/services/grace-periods";
import type { PlanType } from "@prisma/client";

async function assertAdmin() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    throw new Error("Only admins can change class rates");
  }
}

export async function updateSessionPricingAction(
  _prev: unknown,
  formData: FormData
): Promise<{ success: boolean; message?: string }> {
  try {
    await assertAdmin();

    const updates: {
      planType: PlanType;
      daysPerWeek: number;
      pricePerSession: number;
    }[] = [];

    for (const planType of ["REGULAR", "ONE_TO_ONE"] as const) {
      for (let days = 1; days <= 6; days++) {
        const raw = formData.get(`${planType}_${days}`);
        if (raw === null || raw === "") continue;
        const price = Number(raw);
        if (Number.isNaN(price)) {
          return { success: false, message: `Invalid price for ${days} days/week` };
        }
        updates.push({
          planType,
          daysPerWeek: days,
          pricePerSession: Math.round(price),
        });
      }
    }

    await savePricingMaps(updates);
    revalidatePath("/plans");
    revalidatePath("/students", "layout");
    updateTag("pricing");
    updateTag("students");

    return { success: true, message: "Class rates updated. Calculator and new plans use these prices." };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to save rates",
    };
  }
}

/**
 * Updates grace period settings from the pricing popup.
 * Expects form fields named: grace_{sessionsPerWeek}_{planMonths}
 * e.g. grace_2_1 = 4 days for (2 sessions/week, 1-month plan)
 */
export async function updateGracePeriodAction(
  _prev: unknown,
  formData: FormData
): Promise<{ success: boolean; message?: string }> {
  try {
    await assertAdmin();

    const updates: {
      sessionsPerWeek: number;
      planMonths: number;
      graceDays: number;
    }[] = [];

    // sessionsPerWeek 1–6, planMonths 1 and 3
    for (const spw of [1, 2, 3, 4, 5, 6]) {
      for (const months of [1, 3]) {
        const raw = formData.get(`grace_${spw}_${months}`);
        if (raw === null || raw === "") continue;
        const days = Number(raw);
        if (Number.isNaN(days) || days < 0) {
          return {
            success: false,
            message: `Invalid grace days for ${spw} sessions/week, ${months}-month plan`,
          };
        }
        updates.push({
          sessionsPerWeek: spw,
          planMonths: months,
          graceDays: Math.round(days),
        });
      }
    }

    await saveGracePeriodMap(updates);
    revalidatePath("/plans");
    updateTag("grace-periods");
    updateTag("students");

    return { success: true, message: "Grace period settings saved." };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to save grace periods",
    };
  }
}
