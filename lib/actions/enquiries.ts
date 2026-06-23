"use server";

import { auth } from "@/auth";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
} from "@/lib/services/enquiries";
import {
  createEnquirySchema,
  updateEnquirySchema,
} from "@/lib/validations/enquiry";
import type { EnquiryStatus } from "@prisma/client";

async function assertCanManageEnquiries() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "STAFF")) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createEnquiryAction(
  _prev: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  message?: string;
  enquiryId?: string;
  enquiryNumber?: number;
  errors?: Record<string, string[]>;
}> {
  try {
    await assertCanManageEnquiries();

    const raw = {
      childName: formData.get("childName"),
      childAge: formData.get("childAge"),
      gender: formData.get("gender"),
      parentName: formData.get("parentName"),
      contactNumber: formData.get("contactNumber"),
      source: formData.get("source"),
      interestedIn: formData.get("interestedIn") || undefined,
      notes: formData.get("notes") || undefined,
      followUpDate: formData.get("followUpDate") || undefined,
    };

    const parsed = createEnquirySchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    const followUpDate = parsed.data.followUpDate
      ? new Date(parsed.data.followUpDate)
      : null;

    const enquiry = await createEnquiry({
      childName: parsed.data.childName,
      childAge: parsed.data.childAge,
      gender: parsed.data.gender,
      parentName: parsed.data.parentName,
      contactNumber: parsed.data.contactNumber,
      source: parsed.data.source,
      interestedIn: parsed.data.interestedIn,
      notes: parsed.data.notes,
      followUpDate,
    });

    revalidatePath("/enquiries");
    revalidatePath("/dashboard");
    updateTag("enquiries");

    return {
      success: true,
      message: "Enquiry created successfully",
      enquiryId: enquiry.id,
      enquiryNumber: enquiry.enquiryNumber,
    };
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to create enquiry",
    };
  }
}

export async function updateEnquiryAction(
  enquiryId: string,
  _prev: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  message?: string;
  enquiryId?: string;
  enquiryNumber?: number;
  errors?: Record<string, string[]>;
}> {
  try {
    await assertCanManageEnquiries();

    const raw = {
      childName: formData.get("childName"),
      childAge: formData.get("childAge"),
      gender: formData.get("gender"),
      parentName: formData.get("parentName"),
      contactNumber: formData.get("contactNumber"),
      source: formData.get("source"),
      interestedIn: formData.get("interestedIn") || undefined,
      notes: formData.get("notes") || undefined,
      followUpDate: formData.get("followUpDate") || undefined,
      status: formData.get("status"),
    };

    const parsed = updateEnquirySchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    const followUpDate = parsed.data.followUpDate
      ? new Date(parsed.data.followUpDate)
      : null;

    await updateEnquiry(enquiryId, {
      childName: parsed.data.childName,
      childAge: parsed.data.childAge,
      gender: parsed.data.gender,
      parentName: parsed.data.parentName,
      contactNumber: parsed.data.contactNumber,
      source: parsed.data.source,
      interestedIn: parsed.data.interestedIn,
      status: parsed.data.status as EnquiryStatus,
      notes: parsed.data.notes,
      followUpDate,
    });

    revalidatePath(`/enquiries/${enquiryId}`);
    revalidatePath("/enquiries");
    revalidatePath("/dashboard");
    updateTag("enquiries");

    redirect("/enquiries");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to update enquiry",
    };
  }
}

export async function deleteEnquiryAction(id: string) {
  try {
    await assertCanManageEnquiries();

    await deleteEnquiry(id);

    revalidatePath("/enquiries");
    revalidatePath("/dashboard");
    updateTag("enquiries");

    return { success: true, message: "Enquiry deleted successfully" };
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to delete enquiry",
    };
  }
}

export async function updateEnquiryStatusAction(id: string, status: string) {
  try {
    await assertCanManageEnquiries();

    const validStatuses: EnquiryStatus[] = [
      "NEW",
      "CONTACTED",
      "FOLLOW_UP",
      "CONVERTED",
      "LOST",
    ];
    if (!validStatuses.includes(status as EnquiryStatus)) {
      return { success: false, message: "Invalid status" };
    }

    const { prisma } = await import("@/lib/prisma");
    await prisma.enquiry.update({
      where: { id },
      data: { status: status as EnquiryStatus },
    });

    revalidatePath("/enquiries");
    revalidatePath("/dashboard");
    updateTag("enquiries");

    return { success: true, message: "Status updated successfully" };
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to update status",
    };
  }
}
