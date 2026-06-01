import React from "react";
import { auth } from "@/auth";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user;
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <DashboardOverview firstName={firstName} />
    </div>
  );
}
