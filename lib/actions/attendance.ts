"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, updateTag } from "next/cache";
import { getMonthlyAttendanceData, getYearlyMonthlyBreakdown } from "@/lib/services/cached";
import { computeStudentStatus } from "@/lib/utils/student";

export async function fetchChartDataAction(year: number, month: number) {
  const [monthData, yearlyBreakdown] = await Promise.all([
    getMonthlyAttendanceData(year, month),
    getYearlyMonthlyBreakdown(year),
  ]);

  return {
    yearlyBreakdown,
    registrationsByDate: monthData.registrationsByDate,
    renewalsByDate: monthData.renewalsByDate,
  };
}

export async function searchStudentsForAttendanceAction(query: string) {
  try {
    const q = query.trim();
    if (!q) return [];

    // Check if query starts with "TAG" (case-insensitive) and extract the number
    let studentNumberFilter: number | undefined = undefined;
    const tagMatch = q.match(/^tag\s*(\d+)/i);
    if (tagMatch) {
      studentNumberFilter = parseInt(tagMatch[1], 10);
    } else if (/^\d+$/.test(q)) {
      studentNumberFilter = parseInt(q, 10);
    }

    const students = await prisma.student.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          ...(studentNumberFilter !== undefined
            ? [{ studentNumber: { equals: studentNumberFilter } }]
            : []),
        ]
      },
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
      },
      orderBy: { studentNumber: "asc" },
      take: 10,
    });

    return students.map((s) => {
      const activePlan = s.plans[0] ?? null;
      const status = computeStudentStatus(
        activePlan
          ? {
              sessionsCompleted: activePlan.sessionsCompleted,
              totalSessions: activePlan.totalSessions,
              endDate: activePlan.endDate,
              expiryDate: activePlan.expiryDate,
              freezeStartDate: activePlan.freezeStartDate,
              freezeEndDate: activePlan.freezeEndDate,
              freezePeriods: activePlan.freezePeriods,
              lastAttendanceDate: activePlan.attendances?.[0]?.date ?? null,
            }
          : null
      );

      return {
        id: s.id,
        studentNumber: s.studentNumber,
        name: s.name,
        avatarUrl: s.avatarUrl,
        gender: s.gender,
        status,
        activePlan: activePlan ? {
          id: activePlan.id,
          planType: activePlan.planType,
          expiryDate: activePlan.expiryDate,
          sessionsCompleted: activePlan.sessionsCompleted,
          totalSessions: activePlan.totalSessions,
        } : null,
      };
    });
  } catch (err) {
    console.error("Search error:", err);
    return [];
  }
}

export async function markAttendanceAction(studentId: string, dateStr: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
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

    if (!student) {
      return { success: false, message: "Student not found" };
    }

    const activePlan = student.plans[0];
    if (!activePlan) {
      return { success: false, message: "No active plan found for this student. Please assign a plan first." };
    }

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

    if (status !== "ACTIVE" && status !== "GRACE" && status !== "FREEZE") {
      return {
        success: false,
        message: `Cannot mark attendance. Student plan is ${status.toLowerCase().replace("_", " ")}.`
      };
    }

    const attendanceDate = new Date(dateStr + "T00:00:00.000Z");

    // Check if attendance is already marked for this date
    const existing = await prisma.attendance.findUnique({
      where: {
        studentId_date: {
          studentId,
          date: attendanceDate,
        }
      }
    });

    if (existing) {
      return { success: false, message: `${student.name} is already marked present for today.` };
    }

    await prisma.$transaction(async (tx) => {
      // Create attendance record
      await tx.attendance.create({
        data: {
          studentId,
          studentPlanId: activePlan.id,
          date: attendanceDate,
        }
      });

      // Increment sessionsCompleted in the active plan
      await tx.studentPlan.update({
        where: { id: activePlan.id },
        data: {
          sessionsCompleted: {
            increment: 1,
          }
        }
      });
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/attendance");
    revalidatePath("/admin/students");
    updateTag("attendance");
    updateTag("students");
    updateTag("dashboard");

    return {
      success: true,
      message: `Attendance marked successfully for ${student.name}`,
      student: {
        id: student.id,
        studentNumber: student.studentNumber,
        name: student.name,
        activePlan: activePlan.planType === "ONE_TO_ONE" ? "Personal training" : "Group class",
        sessionsCompleted: activePlan.sessionsCompleted + 1,
        totalSessions: activePlan.totalSessions,
      }
    };
  } catch (err: any) {
    console.error("Mark attendance error:", err);
    return { success: false, message: err.message || "Failed to mark attendance" };
  }
}

/**
 * Preloads all session data needed for the attendance scanner in one parallel DB fetch.
 * Called once when the QR scanner modal opens — not per scan.
 * Returns:
 *  - students:           all active-plan students with their plan metadata
 *  - attendedStudentIds: student IDs already marked present today
 */
export async function getAttendanceSessionDataAction() {
  try {
    // Compute today's UTC date boundaries (matches how markAttendanceAction stores dates)
    const now = new Date();
    const todayUTC = new Date(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T00:00:00.000Z`
    );
    const tomorrowUTC = new Date(todayUTC);
    tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);

    // Single parallel round-trip: active students + today's attendance
    const [students, todayAttendance] = await Promise.all([
      prisma.student.findMany({
        where: { plans: { some: { isActive: true } } },
        select: {
          id: true,
          studentNumber: true,
          name: true,
          plans: {
            where: { isActive: true },
            take: 1,
            select: {
              id: true,
              planType: true,
              sessionsCompleted: true,
              totalSessions: true,
              endDate: true,
              expiryDate: true,
              freezeStartDate: true,
              freezeEndDate: true,
              freezePeriods: {
                select: {
                  startDate: true,
                  endDate: true,
                }
              },
              attendances: {
                orderBy: { date: "desc" },
                take: 1,
                select: { date: true },
              }
            },
          },
        },
        orderBy: { studentNumber: "asc" },
      }),
      prisma.attendance.findMany({
        where: { date: { gte: todayUTC, lt: tomorrowUTC } },
        select: { studentId: true },
      }),
    ]);

    const validStudents = students
      .map((s) => {
        const activePlan = s.plans[0] ?? null;
        const status = computeStudentStatus(
          activePlan
            ? {
                sessionsCompleted: activePlan.sessionsCompleted,
                totalSessions: activePlan.totalSessions,
                endDate: activePlan.endDate,
                expiryDate: activePlan.expiryDate,
                freezeStartDate: activePlan.freezeStartDate,
                freezeEndDate: activePlan.freezeEndDate,
                freezePeriods: activePlan.freezePeriods,
                lastAttendanceDate: activePlan.attendances?.[0]?.date ?? null,
              }
            : null
        );

        return {
          id: s.id,
          studentNumber: s.studentNumber,
          name: s.name,
          status,
          activePlan: activePlan
            ? {
                planType: activePlan.planType as string,
                sessionsCompleted: activePlan.sessionsCompleted,
                totalSessions: activePlan.totalSessions,
              }
            : null,
        };
      })
      .filter((s) => s.status === "ACTIVE" || s.status === "GRACE" || s.status === "FREEZE");

    return {
      students: validStudents.map(({ id, studentNumber, name, activePlan }) => ({
        id,
        studentNumber,
        name,
        activePlan,
      })),
      // Deduplicated list of student IDs already marked present today
      attendedStudentIds: [...new Set(todayAttendance.map((a) => a.studentId))],
    };
  } catch (err) {
    console.error("getAttendanceSessionDataAction error:", err);
    // Return empty data gracefully — scanner falls back to per-scan server calls
    return { students: [], attendedStudentIds: [] as string[] };
  }
}

export async function undoMarkAttendanceAction(studentId: string, dateStr: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        plans: {
          where: { isActive: true },
          take: 1,
        }
      }
    });

    if (!student) {
      return { success: false, message: "Student not found" };
    }

    const activePlan = student.plans[0];
    if (!activePlan) {
      return { success: false, message: "No active plan found for this student." };
    }

    const attendanceDate = new Date(dateStr + "T00:00:00.000Z");

    await prisma.$transaction(async (tx) => {
      // Delete attendance record
      await tx.attendance.delete({
        where: {
          studentId_date: {
            studentId,
            date: attendanceDate,
          }
        }
      });

      // Decrement sessionsCompleted in the active plan (making sure we don't go below 0)
      const currentCompleted = activePlan.sessionsCompleted;
      const nextCompleted = Math.max(0, currentCompleted - 1);
      await tx.studentPlan.update({
        where: { id: activePlan.id },
        data: {
          sessionsCompleted: nextCompleted,
        }
      });
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/attendance");
    revalidatePath("/admin/students");
    updateTag("attendance");
    updateTag("students");
    updateTag("dashboard");

    return { success: true, message: `Attendance undone successfully for ${student.name}` };
  } catch (err: any) {
    console.error("Undo attendance error:", err);
    return { success: false, message: err.message || "Failed to undo attendance" };
  }
}

export async function markCoachAttendanceFromScanAction(coachId: string) {
  try {
    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
    });

    if (!coach) {
      return { success: false, message: "Employee not found" };
    }

    if (coach.status === "LEFT") {
      return { success: false, message: "Cannot mark attendance for an employee who has left." };
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const attendanceDate = new Date(dateStr + "T00:00:00.000Z");

    // Check if attendance is already marked for this date
    const existing = await prisma.coachAttendance.findUnique({
      where: {
        coachId_date: {
          coachId,
          date: attendanceDate,
        }
      }
    });

    if (existing) {
      return { success: false, message: `${coach.name} is already marked present for today.` };
    }

    await prisma.coachAttendance.create({
      data: {
        coachId,
        date: attendanceDate,
        status: "PRESENT",
      }
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/coaches");
    revalidatePath(`/admin/coaches/${coachId}`);
    updateTag("coaches");
    updateTag("attendance");
    updateTag("dashboard");

    return {
      success: true,
      message: `Attendance marked successfully for ${coach.name}`,
      employee: {
        id: coach.id,
        name: coach.name,
        role: coach.role, // "COACH" or "STAFF"
      }
    };
  } catch (err: any) {
    console.error("Mark coach attendance scan error:", err);
    return { success: false, message: err.message || "Failed to mark employee attendance" };
  }
}

