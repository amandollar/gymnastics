"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { saveGracePeriodMap } from "@/lib/services/grace-periods";

type ActionResult = { success: boolean; message?: string };

async function assertAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "ADMIN") {
    throw new Error("Unauthorized: only admins can manage grace periods");
  }
}

export async function updateGracePeriodsAction(
  _prev: unknown,
  updates: { sessionsPerWeek: number; planMonths: number; graceDays: number }[]
): Promise<ActionResult> {
  try {
    await assertAdmin();
    await saveGracePeriodMap(updates);
    revalidatePath("/settings");
    return { success: true, message: "Grace period settings updated successfully" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to update grace periods",
    };
  }
}
