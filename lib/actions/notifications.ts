"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, updateTag } from "next/cache";

async function assertCanManage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "MANAGER")) {
    throw new Error("Unauthorized");
  }
}

export async function createNotificationAction(studentId: string, message: string) {
  try {
    await assertCanManage();

    if (!message || !message.trim()) {
      return { success: false, message: "Notification message cannot be empty" };
    }

    const notification = await (prisma as any).notification.create({
      data: {
        studentId,
        message: message.trim(),
      },
    });

    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/portal");
    updateTag("notifications");

    return { success: true, notification };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to send notification",
    };
  }
}

export async function getStudentNotificationsAction(studentId: string) {
  try {
    const session = await auth();
    if (!session?.user) return [];

    const role = (session.user as { role?: string })?.role;
    const userId = (session.user as { id?: string })?.id;

    const canManage = role === "ADMIN" || role === "MANAGER";
    const isOwner = role === "PARENT" && userId === studentId;

    if (!canManage && !isOwner) {
      throw new Error("Unauthorized");
    }

    const notifications = await (prisma as any).notification.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    });

    return JSON.parse(JSON.stringify(notifications));
  } catch {
    return [];
  }
}

export async function markNotificationsAsReadAction(studentId: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, message: "Not authenticated" };

    const role = (session.user as { role?: string })?.role;
    const userId = (session.user as { id?: string })?.id;

    const canManage = role === "ADMIN" || role === "MANAGER";
    const isOwner = role === "PARENT" && userId === studentId;

    if (!canManage && !isOwner) {
      return { success: false, message: "Unauthorized" };
    }

    await (prisma as any).notification.updateMany({
      where: { studentId, isRead: false },
      data: { isRead: true },
    });

    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/portal");
    updateTag("notifications");

    return { success: true };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to mark notifications as read",
    };
  }
}
