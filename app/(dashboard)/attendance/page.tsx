import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AttendancePageClient from "@/components/attendance/AttendancePageClient";
import {
  getMonthlyAttendanceData,
  getYearlyMonthlyBreakdown,
} from "@/lib/services/attendance";

export const metadata = {
  title: "Attendance — TAG CRM",
  description: "Track daily student attendance, new admissions, and renewals for TAG Academy.",
};

interface PageProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function AttendancePage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

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
        yearlyBreakdown={yearlyBreakdown}
        todayStr={todayStr}
        year={year}
        month={month}
      />
    </div>
  );
}
