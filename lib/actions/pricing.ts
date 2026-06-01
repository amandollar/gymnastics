"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { savePricingMaps } from "@/lib/services/pricing";
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

    return { success: true, message: "Class rates updated. Calculator and new plans use these prices." };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to save rates",
    };
  }
}
