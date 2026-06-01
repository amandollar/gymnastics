"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  createPlanTemplate,
  deletePlanTemplate,
} from "@/lib/services/plan-templates";
import { planTemplateSchema } from "@/lib/validations/student";

async function assertAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function createPlanTemplateAction(
  _prev: unknown,
  formData: FormData
) {
  try {
    await assertAdmin();

    const raw = Object.fromEntries(formData.entries());
    const parsed = planTemplateSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    await createPlanTemplate({
      name: parsed.data.name,
      planType: parsed.data.planType,
      durationMonths: parsed.data.durationMonths,
      totalSessions: parsed.data.totalSessions,
      validityDays: parsed.data.validityDays,
      defaultFee: parsed.data.defaultFee,
      description: parsed.data.description,
    });

    revalidatePath("/plans");
    return { success: true, message: "Plan template created" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to create plan",
    };
  }
}

export async function deletePlanTemplateAction(id: string) {
  try {
    await assertAdmin();
    await deletePlanTemplate(id);
    revalidatePath("/plans");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to delete plan",
    };
  }
}
