import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAcademyProfile } from "@/lib/services/academy";
import { computeStudentStatus } from "@/lib/utils/student";
import { resolveTemplate } from "@/lib/utils/whatsapp-templates";
import { sendWhatsAppMessageAction } from "@/lib/actions/whatsapp";
import { startOfDay } from "@/lib/plan/calculations";

export const maxDuration = 60; // Allow more time for sending multiple messages

export async function GET(req: Request) {
  // Simple auth to prevent accidental triggers. 
  // In production, Vercel Cron will send a CRON_SECRET header we can check, or we can use a query param.
  const url = new URL(req.url);
  const authHeader = req.headers.get("authorization");
  
  // For Vercel Cron
  if (
    process.env.CRON_SECRET && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}` && 
    url.searchParams.get("secret") !== process.env.CRON_SECRET
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const profile = await getAcademyProfile();
    const sentCount = { grace: 0, inactive: 0 };
    
    // 1. Delete logs older than 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const deleteRes = await prisma.messageLog.deleteMany({
      where: { sentAt: { lt: ninetyDaysAgo } }
    });

    // If both are disabled, just return after cleanup
    if (!profile.autoSendGrace && !profile.autoSendInactive) {
      return NextResponse.json({ 
        message: "Automations disabled", 
        cleanupCount: deleteRes.count 
      });
    }

    // 2. Fetch students with an active plan to evaluate Grace and Inactive states
    const students = await prisma.student.findMany({
      where: { plans: { some: { isActive: true } } },
      include: {
        plans: {
          where: { isActive: true },
          take: 1,
          include: {
            freezePeriods: true,
            attendances: {
              orderBy: { date: "desc" },
              take: 1,
              select: { date: true },
            }
          }
        }
      }
    });

    // Helper to send message if not sent in last 14 days
    const sendAutomatedMessage = async (
      student: any,
      templateText: string,
      templateName: string,
      additionalVars: any = {}
    ) => {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const recentLog = await prisma.messageLog.findFirst({
        where: {
          studentId: student.id,
          templateName,
          sentAt: { gte: fourteenDaysAgo }
        }
      });

      if (!recentLog && student.contactNumber) {
        let cleanNumber = student.contactNumber.replace(/\D/g, "");
        if (cleanNumber.length === 10) cleanNumber = "91" + cleanNumber;

        const text = resolveTemplate(templateText, {
          studentName: student.name,
          parentName: student.parentName || "",
          portalLink: profile.parentPortalUrl || "",
          ...additionalVars
        });

        await sendWhatsAppMessageAction({
          to: cleanNumber,
          type: "text",
          text,
          studentId: student.id,
          templateName,
          isAutomated: true,
        });
        return true;
      }
      return false;
    };

    for (const student of students) {
      const activePlan = student.plans[0];
      if (!activePlan) continue;

      const status = computeStudentStatus({
        sessionsCompleted: activePlan.sessionsCompleted,
        totalSessions: activePlan.totalSessions,
        endDate: activePlan.endDate,
        expiryDate: activePlan.expiryDate,
        freezeStartDate: activePlan.freezeStartDate,
        freezeEndDate: activePlan.freezeEndDate,
        freezePeriods: activePlan.freezePeriods,
        lastAttendanceDate: activePlan.attendances?.[0]?.date ?? null,
      });

      if (status === "GRACE" && profile.autoSendGrace && profile.templateGrace) {
        const diffTime = new Date(activePlan.expiryDate).getTime() - startOfDay(new Date()).getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const sent = await sendAutomatedMessage(
          student, 
          profile.templateGrace, 
          "Grace Period Reminder",
          {
            planType: activePlan.planType === "ONE_TO_ONE" ? "Personal training" : "Group class",
            graceDeadline: new Date(activePlan.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
            daysLeft: Math.max(0, diffDays).toString(),
            remainingSessions: Math.max(0, activePlan.totalSessions - activePlan.sessionsCompleted).toString(),
          }
        );
        if (sent) sentCount.grace++;
      } 
      else if (status === "INACTIVE" && profile.autoSendInactive && profile.templateInactive) {
        const sent = await sendAutomatedMessage(
          student,
          profile.templateInactive,
          "Inactive Reminder",
          {
            planType: activePlan.planType === "ONE_TO_ONE" ? "Personal training" : "Group class",
          }
        );
        if (sent) sentCount.inactive++;
      }
    }

    return NextResponse.json({
      success: true,
      cleanupCount: deleteRes.count,
      messagesSent: sentCount,
    });
  } catch (error) {
    console.error("Automations API error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
