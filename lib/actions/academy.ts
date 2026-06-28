"use server";

import { auth } from "@/auth";
import { revalidatePath, updateTag } from "next/cache";
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

async function assertCanManageSettings() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "STAFF")) {
    throw new Error("Unauthorized: only admins and staff can manage message templates");
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
    updateTag("academy");
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
  templateAllSessionsCompleted: string;
  templateLoginCredentials: string;
  templateEnquiryFollowUp: string;
  templateAdmissionWelcome: string;
  templatePaymentReceived: string;
}): Promise<ActionResult> {
  try {
    await assertCanManageSettings();
    const profile = await getAcademyProfile();
    const updateData = {
      templateGrace: data.templateGrace.trim() || null,
      templateFeeReminder: data.templateFeeReminder.trim() || null,
      templateInactive: data.templateInactive.trim() || null,
      templateInactiveSessionComplete: data.templateAllSessionsCompleted.trim() || null,
      templateLoginCredentials: data.templateLoginCredentials.trim() || null,
      templateEnquiryFollowUp: data.templateEnquiryFollowUp.trim() || null,
      templateAdmissionWelcome: data.templateAdmissionWelcome.trim() || null,
      templatePaymentReceived: data.templatePaymentReceived.trim() || null,
    };
    await prisma.academyProfile.update({
      where: { id: profile.id },
      data: updateData,
    });
    revalidatePath("/admin/settings");
    updateTag("academy");
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
        templateAllSessionsCompleted: profile.templateInactiveSessionComplete,
        templateLoginCredentials: (profile as any).templateLoginCredentials as string | null,
        templateEnquiryFollowUp: (profile as any).templateEnquiryFollowUp as string | null,
        templateAdmissionWelcome: (profile as any).templateAdmissionWelcome as string | null,
        templatePaymentReceived: (profile as any).templatePaymentReceived as string | null,
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

export async function saveAutomationSettingsAction(data: {
  autoSendGrace: boolean;
  autoSendInactive: boolean;
  autoSendAllSessionsCompleted: boolean;
}): Promise<ActionResult> {
  try {
    await assertCanManageSettings();
    const profile = await getAcademyProfile();
    const updateData = {
      autoSendGrace: data.autoSendGrace,
      autoSendInactive: data.autoSendInactive,
      autoSendAllSessionsCompleted: data.autoSendAllSessionsCompleted,
    };
    await prisma.academyProfile.update({
      where: { id: profile.id },
      data: updateData,
    });
    revalidatePath("/admin/settings");
    updateTag("academy");
    return { success: true, message: "Automation settings saved successfully" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to save automation settings",
    };
  }
}

export async function getMessageLogsAction() {
  try {
    await assertCanManageSettings();
    const logs = await prisma.messageLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 200,
      include: {
        student: {
          select: {
            name: true,
            studentNumber: true,
            avatarUrl: true,
            gender: true,
          }
        },
        enquiry: {
          select: {
            childName: true,
            enquiryNumber: true,
            gender: true,
          }
        }
      }
    });

    const mappedLogs = logs.map((log) => ({
      id: log.id,
      templateName: log.templateName,
      isAutomated: log.isAutomated,
      sentAt: log.sentAt,
      student: log.student ? {
        name: log.student.name,
        studentNumber: log.student.studentNumber,
        avatarUrl: log.student.avatarUrl,
        gender: log.student.gender,
      } : log.enquiry ? {
        name: log.enquiry.childName + " (Enquiry)",
        studentNumber: log.enquiry.enquiryNumber,
        avatarUrl: null,
        gender: log.enquiry.gender,
      } : {
        name: "Unknown",
        studentNumber: 0,
        avatarUrl: null,
        gender: "MALE",
      }
    }));

    return { success: true, logs: mappedLogs };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to load message logs",
      logs: [],
    };
  }
}
