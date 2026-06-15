"use server";

import { getMonthlyAttendanceData, getYearlyMonthlyBreakdown } from "@/lib/services/cached";

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
