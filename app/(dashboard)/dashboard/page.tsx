import React from "react";
import { getSession } from "@/lib/auth-session";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import { getDashboardData } from "@/lib/services/dashboard";

export default async function DashboardPage() {
  const session = await getSession();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  const dashboardData = await getDashboardData();

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <DashboardOverview firstName={firstName} dashboardData={dashboardData} />
    </div>
  );
}
