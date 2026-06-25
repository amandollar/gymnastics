import React from "react";
import { getSession, getCanManage } from "@/lib/auth-session";
import DashboardOverview from "@/app/admin/_components/dashboard/DashboardOverview";
import { getDashboardData, getAcademyProfile } from "@/lib/services/cached";

export default async function DashboardPage() {
  const session = await getSession();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  const [dashboardData, academyProfile, canManage] = await Promise.all([
    getDashboardData(),
    getAcademyProfile(),
    getCanManage(),
  ]);

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <DashboardOverview
        firstName={firstName}
        dashboardData={dashboardData}
        academyProfile={academyProfile}
        canManage={canManage}
      />
    </div>
  );
}
