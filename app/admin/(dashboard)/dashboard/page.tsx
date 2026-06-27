import React from "react";
import { getSession, getCanManage } from "@/lib/auth-session";
import DashboardOverview from "@/app/admin/_components/dashboard/DashboardOverview";
import { getDashboardData, getAcademyProfile, listStudentsWithReminders } from "@/lib/services/cached";

export default async function DashboardPage() {
  const session = await getSession();
  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const userRole = (session?.user as { role?: string })?.role || "STAFF";
  const isAdmin = userRole === "ADMIN";

  const [dashboardData, academyProfile, canManage, rawReminders] = await Promise.all([
    getDashboardData(),
    getAcademyProfile(),
    getCanManage(),
    listStudentsWithReminders(),
  ]);

  const reminders = JSON.parse(JSON.stringify(rawReminders));

  let sanitizedDashboardData = dashboardData;
  if (!isAdmin) {
    sanitizedDashboardData = {
      ...dashboardData,
      kpis: {
        ...dashboardData.kpis,
        monthlyRevenue: 0,
      },
      revenueDaily: [],
      revenueMonthly: [],
    };
  }

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <DashboardOverview
        firstName={firstName}
        dashboardData={sanitizedDashboardData}
        academyProfile={academyProfile}
        canManage={canManage}
        isAdmin={isAdmin}
        reminders={reminders}
      />
    </div>
  );
}
