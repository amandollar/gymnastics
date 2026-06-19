import React from "react";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { getSession } from "@/lib/auth-session";
import { getAllUsers, listStudents } from "@/lib/services/cached";
import { listBatches } from "@/lib/services/batches";
import { getGracePeriodMap } from "@/lib/services/grace-periods";
import { getPricingMaps } from "@/lib/services/pricing";
import { getAcademyProfile } from "@/lib/services/academy";
import SettingsShell from "@/components/settings/SettingsShell";

export default async function SettingsPage() {
  const session = await getSession();
  const user = session?.user;

  // Protect page: Only ADMIN role is authorized
  const userRole = (user as { role?: string })?.role;
  if (!session || userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch settings data in parallel
  const [users, batches, gracePeriodMap, pricingMaps, academyProfile, students] = await Promise.all([
    getAllUsers(),
    listBatches(),
    getGracePeriodMap(),
    getPricingMaps(),
    getAcademyProfile(),
    listStudents(),
  ]);

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <SettingsShell
      initialUsers={users as any[]}
      currentUserId={(user as { id: string }).id}
      initialBatches={batches}
      initialGracePeriodMap={gracePeriodMap}
      initialPricingMaps={pricingMaps}
      initialProfile={academyProfile}
      userRole={userRole}
      signOutAction={signOutAction}
      students={JSON.parse(JSON.stringify(students))}
    />
  );
}


