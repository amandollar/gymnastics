"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { updateAcademyProfile, getAcademyProfile } from "@/lib/services/academy";
import { prisma } from "@/lib/prisma";

type ActionResult = { success: boolean; message?: string };

async function assertAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "ADMIN") {
    throw new Error("Unauthorized: only admins can manage academy profile");
  }
}

export async function updateAcademyProfileAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const email = (formData.get("email") as string | null)?.trim() ?? "";
    const phone = (formData.get("phone") as string | null)?.trim() ?? "";
    const phone2 = (formData.get("phone2") as string | null)?.trim() ?? "";
    const address = (formData.get("address") as string | null)?.trim() ?? "";
    const website = (formData.get("website") as string | null)?.trim() ?? "";

    if (!address) {
      return { success: false, message: "Address is required" };
    }

    await updateAcademyProfile({ email, phone, phone2, address, website });
    revalidatePath("/admin/settings");
    return { success: true, message: "Academy profile updated successfully" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to update academy profile",
    };
  }
}

export async function saveMessageTemplatesAction(data: {
  templateGrace: string;
  templateFeeReminder: string;
  templateInactive: string;
}): Promise<ActionResult> {
  try {
    await assertAdmin();
    const profile = await getAcademyProfile();
    await prisma.academyProfile.update({
      where: { id: profile.id },
      data: {
        templateGrace: data.templateGrace.trim() || null,
        templateFeeReminder: data.templateFeeReminder.trim() || null,
        templateInactive: data.templateInactive.trim() || null,
      },
    });
    revalidatePath("/admin/settings");
    return { success: true, message: "Templates saved successfully" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to save templates",
    };
  }
}
