import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import CoachesPageClient from "@/components/coaches/CoachesPageClient";
import { listCoaches } from "@/lib/services/cached";

export const metadata = {
  title: "Coaches — TAG CRM",
  description: "Manage coaches, track daily attendance and view monthly earnings for personal training.",
};

export default async function CoachesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const todayStr = `${y}-${m}-${d}`;

  // Load all coaches with today's attendance pre-populated
  const coaches = await listCoaches({ status: "ALL" });

  // Also fetch today's attendance records for each coach
  const { prisma } = await import("@/lib/prisma");
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

  // Merge today's attendance into each coach
  const coachesWithAttendance = (coaches as any[]).map((c) => ({
    ...c,
    todayAttendance: attendanceMap[c.id] ? { status: attendanceMap[c.id] } : null,
    joinDate: new Date(c.joinDate),
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
  }));

  return (
    <div className="mx-auto max-w-6xl min-w-0 w-full">
      <CoachesPageClient
        coaches={JSON.parse(JSON.stringify(coachesWithAttendance))}
        todayStr={todayStr}
      />
    </div>
  );
}
