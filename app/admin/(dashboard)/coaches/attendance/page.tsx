import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import CoachesAttendanceClient from "@/components/coaches/CoachesAttendanceClient";
import { listCoaches, getCoachMonthlyAttendanceSerializable } from "@/lib/services/cached";

export const metadata = {
  title: "Coach Attendance — TAG CRM",
  description: "View and manage monthly attendance for all coaches.",
};

interface PageProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function CoachesAttendancePage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const year = parseInt(params.year ?? String(currentYear), 10);
  const month = parseInt(params.month ?? String(currentMonth), 10);

  // Fetch all coaches (status ALL to support past attendance records of coaches who left)
  // and the monthly attendance grid
  const [coaches, attendanceData] = await Promise.all([
    listCoaches({ status: "ALL" }),
    getCoachMonthlyAttendanceSerializable(year, month),
  ]);

  // Clean dates or serialize properly if needed (already plain arrays/objects)
  const serializedCoaches = JSON.parse(JSON.stringify(coaches));
  const serializedAttendance = JSON.parse(JSON.stringify(attendanceData));

  // Also get today's date string formatted as YYYY-MM-DD for checking cell edits
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const todayStr = `${y}-${m}-${d}`;

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <CoachesAttendanceClient
        coaches={serializedCoaches}
        attendanceData={serializedAttendance}
        year={year}
        month={month}
        todayStr={todayStr}
      />
    </div>
  );
}
