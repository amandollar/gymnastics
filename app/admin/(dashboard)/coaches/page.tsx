import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import CoachesPageClient from "@/app/admin/_components/coaches/CoachesPageClient";
import { listCoaches } from "@/lib/services/cached";

export const metadata = {
  title: "Employees — TAG CRM",
  description: "Manage employees, track daily attendance, and view monthly earnings.",
};

export default async function CoachesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const todayStr = `${y}-${m}-${d}`;

  const { prisma } = await import("@/lib/prisma");

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const startOfMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
  const endOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1));

  // Load all coaches with all details needed for card computations
  const dbCoaches = await (prisma as any).coach.findMany({
    include: {
      studentPlans: {
        where: { isActive: true, planType: "ONE_TO_ONE" },
        select: {
          id: true,
          fee: true,
          commissionPercent: true,
          planMonths: true,
          startDate: true,
          endDate: true,
          pricePerSession: true,
          attendances: {
            select: {
              date: true,
            },
          },
        },
      },
      attendances: {
        where: {
          date: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
        },
        select: {
          date: true,
          status: true,
        },
      },
      salaryPayments: {
        select: {
          year: true,
          month: true,
          paid: true,
          amount: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const todayUTC = new Date(`${todayStr}T00:00:00.000Z`);
  const tomorrowUTC = new Date(todayUTC);
  tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);

  const todayAttendances = await (prisma as any).coachAttendance.findMany({
    where: {
      date: { gte: todayUTC, lt: tomorrowUTC },
    },
    select: { coachId: true, status: true },
  });

  const attendanceMap: Record<string, "PRESENT" | "ABSENT"> = {};
  for (const a of todayAttendances) {
    attendanceMap[a.coachId] = a.status;
  }

  // Merge today's attendance into each coach and serialize dates
  const coachesWithAttendance = dbCoaches.map((c: any) => ({
    ...c,
    todayAttendance: attendanceMap[c.id] ? { status: attendanceMap[c.id] } : null,
    activeStudentCount: c.studentPlans.length,
    joinDate: c.joinDate.toISOString(),
    leftDate: c.leftDate ? c.leftDate.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    studentPlans: c.studentPlans.map((p: any) => ({
      ...p,
      startDate: p.startDate.toISOString(),
      endDate: p.endDate.toISOString(),
      attendances: p.attendances ? p.attendances.map((a: any) => ({
        ...a,
        date: a.date.toISOString(),
      })) : [],
    })),
    attendances: c.attendances.map((a: any) => ({
      ...a,
      date: a.date.toISOString(),
    })),
  }));

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <CoachesPageClient
        coaches={JSON.parse(JSON.stringify(coachesWithAttendance))}
        todayStr={todayStr}
      />
    </div>
  );
}
