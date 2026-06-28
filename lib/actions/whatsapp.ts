"use server";

import { auth } from "@/auth";
import { v2 as cloudinary } from "cloudinary";
import { sendWhatsAppMessage } from "@/lib/services/whatsapp";
import { prisma } from "@/lib/prisma";

async function assertCanSendNotifications() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "STAFF")) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Server Action to send a WhatsApp message (text or with a media link).
 */
export async function sendWhatsAppMessageAction(params: {
  to: string;
  type: "text" | "image" | "document";
  text?: string;
  mediaUrl?: string;
  mediaId?: string;
  filename?: string;
  caption?: string;
}) {
  try {
    await assertCanSendNotifications();

    if (params.type === "document" && (params.mediaUrl || params.mediaId)) {
      // Send document message
      const res = await sendWhatsAppMessage({
        to: params.to,
        type: "document",
        document: {
          id: params.mediaId,
          link: params.mediaUrl,
          filename: params.filename || "Receipt.pdf",
          caption: params.caption || params.text,
        },
      });
      return { success: true, messageId: res.messageId };
    } else if (params.type === "image" && params.mediaUrl) {
      // Send image message
      const res = await sendWhatsAppMessage({
        to: params.to,
        type: "image",
        image: {
          link: params.mediaUrl,
          caption: params.caption || params.text,
        },
      });
      return { success: true, messageId: res.messageId };
    } else {
      // Send plain text message
      const res = await sendWhatsAppMessage({
        to: params.to,
        type: "text",
        text: {
          body: params.text || "",
        },
      });
      return { success: true, messageId: res.messageId };
    }
  } catch (e) {
    console.error("sendWhatsAppMessageAction error:", e);
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to send WhatsApp message",
    };
  }
}

/**
 * Server Action to upload a base64 receipt image to Cloudinary.
 */
export async function uploadReceiptImageAction(studentId: string, base64Data: string) {
  try {
    await assertCanSendNotifications();

    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;

    if (!cloud_name || !api_key || !api_secret) {
      throw new Error(
        "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to .env.local"
      );
    }

    cloudinary.config({
      cloud_name,
      api_key,
      api_secret,
      secure: true,
    });

    const folder = (process.env.CLOUDINARY_FOLDER || "tag-crm/students") + "/receipts";

    const isPdf = base64Data.startsWith("data:application/pdf");
    const result = await cloudinary.uploader.upload(base64Data, {
      folder,
      public_id: `receipt_${studentId}_${Date.now()}${isPdf ? ".pdf" : ""}`,
      overwrite: true,
      resource_type: isPdf ? "raw" : "image",
    });

    return { success: true, url: result.secure_url };
  } catch (e) {
    console.error("uploadReceiptImageAction error:", e);
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to upload receipt image to Cloudinary",
    };
  }
}

/**
 * Server Action to test connection credentials.
 */
export async function testWhatsAppConnectionAction(testNumber: string) {
  try {
    // Only Admin can test connection
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session || role !== "ADMIN") {
      throw new Error("Unauthorized: Only administrators can test the WhatsApp connection");
    }

    const res = await sendWhatsAppMessage({
      to: testNumber,
      type: "text",
      text: {
        body: "Connection check successful! This is an automated test message from The Academy of Gymnastics (TAG). 🤸",
      },
    });

    return { success: true, messageId: res.messageId };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "WhatsApp connection test failed",
    };
  }
}

/**
 * Server Action to retrieve student and academy details for drawing the receipt.
 */
export async function getStudentReceiptDetailsAction(studentId: string) {
  try {
    await assertCanSendNotifications();
    
    const [student, academyProfile] = await Promise.all([
      prisma.student.findUnique({
        where: { id: studentId },
        select: {
          name: true,
          studentNumber: true,
          dateOfBirth: true,
          parentName: true,
          contactNumber: true,
          admissionDate: true,
          registrationFee: true,
          password: true,
          isTempPassword: true,
        },
      }),
      prisma.academyProfile.findFirst(),
    ]);

    if (!student) {
      throw new Error("Student not found");
    }

    const academyData = academyProfile || {
      email: "info@academyofgymnastics.com",
      phone: "+91 7977177463",
      phone2: "+91 7757965651",
      address: "Office No 7, 2nd floor, Nine Hills Plaza\nopposite Tribeca High street NIBM Annexe\nPune 411060",
      website: "www.academyofgymnastics.com",
      parentPortalUrl: null,
      id: "default",
      updatedAt: new Date(),
    };

    return {
      success: true,
      student: {
        ...student,
        // Convert dates to string so they are JSON serializable
        dateOfBirth: student.dateOfBirth.toISOString(),
        admissionDate: student.admissionDate.toISOString(),
      },
      academyProfile: academyData,
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to load receipt details",
    };
  }
}

/**
 * Server Action to upload a base64 document directly to Meta's WhatsApp Media API.
 * Yields a secure media_id that can be used directly in messaging.
 */
export async function uploadMediaToWhatsAppAction(base64Data: string, filename: string = "document.pdf") {
  try {
    await assertCanSendNotifications();

    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      throw new Error("WhatsApp credentials are not configured in environment variables.");
    }

    // Parse base64
    const base64Part = base64Data.substring(base64Data.indexOf(",") + 1);
    const buffer = Buffer.from(base64Part, "base64");

    // Form data construction
    const blob = new Blob([buffer], { type: "application/pdf" });
    const formData = new FormData();
    formData.append("messaging_product", "whatsapp");
    formData.append("file", blob, filename);
    formData.append("type", "application/pdf");

    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Meta Media Upload Error response:", data);
      throw new Error(data.error?.message || "Failed to upload media to Meta WhatsApp servers");
    }

    return { success: true, id: data.id as string };
  } catch (e) {
    console.error("uploadMediaToWhatsAppAction error:", e);
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to upload media to WhatsApp",
    };
  }
}

