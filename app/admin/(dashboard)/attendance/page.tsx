import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import AttendancePageClient from "@/app/admin/_components/attendance/AttendancePageClient";
import {
  getMonthlyAttendanceData,
  getYearlyMonthlyBreakdown,
} from "@/lib/services/cached";

export const metadata = {
  title: "Attendance — TAG CRM",
  description: "Track daily student attendance, new admissions, and renewals for TAG Academy.",
};

interface PageProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function AttendancePage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;

  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const todayStr = `${y}-${m}-${d}`;

  // Year/month from URL — default to current month
  const year  = parseInt(params.year  ?? String(today.getFullYear()), 10);
  const month = parseInt(params.month ?? String(today.getMonth() + 1), 10);

  // Two parallel server fetches — all roll-call data for the month is bundled
  // into the first call so the client never needs to re-fetch when changing dates
  const [monthData, yearlyBreakdown] = await Promise.all([
    getMonthlyAttendanceData(year, month),
    getYearlyMonthlyBreakdown(year),
  ]);

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <AttendancePageClient
        kpis={monthData.kpis}
        calendarCounts={monthData.calendarCounts}
        rollCallByDate={monthData.rollCallByDate}
        registrationsByDate={monthData.registrationsByDate}
        renewalsByDate={monthData.renewalsByDate}
        yearlyBreakdown={yearlyBreakdown}
        todayStr={todayStr}
        year={year}
        month={month}
      />
    </div>
  );
}
