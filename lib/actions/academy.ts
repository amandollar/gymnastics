"use server";

import { auth } from "@/auth";
import { revalidatePath, revalidateTag } from "next/cache";
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
    const parentPortalUrl = (formData.get("parentPortalUrl") as string | null)?.trim() ?? "";

    if (!address) {
      return { success: false, message: "Address is required" };
    }

    await updateAcademyProfile({ email, phone, phone2, address, website, parentPortalUrl });
    revalidatePath("/admin/settings");
    revalidateTag("academy");
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
  templateInactiveSessionComplete: string;
  templateLoginCredentials: string;
  templateEnquiryFollowUp: string;
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
        templateInactiveSessionComplete: data.templateInactiveSessionComplete.trim() || null,
        templateLoginCredentials: data.templateLoginCredentials.trim() || null,
        templateEnquiryFollowUp: data.templateEnquiryFollowUp.trim() || null,
      },
    });
    revalidatePath("/admin/settings");
    revalidateTag("academy");
    return { success: true, message: "Templates saved successfully" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to save templates",
    };
  }
}

export async function getAcademyTemplatesAction() {
  try {
    const profile = await getAcademyProfile();
    return {
      success: true,
      website: profile.website,
      parentPortalUrl: profile.parentPortalUrl,
      templates: {
        templateGrace: profile.templateGrace,
        templateFeeReminder: profile.templateFeeReminder,
        templateInactive: profile.templateInactive,
        templateInactiveSessionComplete: profile.templateInactiveSessionComplete,
        templateLoginCredentials: (profile as any).templateLoginCredentials as string | null,
        templateEnquiryFollowUp: (profile as any).templateEnquiryFollowUp as string | null,
      },
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to load templates",
      templates: null,
      website: null,
      parentPortalUrl: null,
    };
  }
}
