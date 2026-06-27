import React from "react";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { getSession } from "@/lib/auth-session";
import { getAllUsers, listStudents } from "@/lib/services/cached";
import { listBatches } from "@/lib/services/batches";
import { getGracePeriodMap } from "@/lib/services/grace-periods";
import { getPricingMaps } from "@/lib/services/pricing";
import { getAcademyProfile } from "@/lib/services/academy";
import SettingsShell from "@/app/admin/_components/settings/SettingsShell";

export default async function SettingsPage() {
  const session = await getSession();
  const user = session?.user;

  // Protect page: ADMIN and STAFF roles are authorized
  const userRole = (user as { role?: string })?.role || "STAFF";
  if (!session || (userRole !== "ADMIN" && userRole !== "STAFF")) {
    redirect("/admin/dashboard");
  }

  const isAdmin = userRole === "ADMIN";

  // Fetch settings data in parallel (conditionally based on role)
  const [users, batches, gracePeriodMap, pricingMaps, academyProfile, students] = await Promise.all([
    isAdmin ? getAllUsers() : Promise.resolve([]),
    isAdmin ? listBatches() : Promise.resolve([]),
    isAdmin ? getGracePeriodMap() : Promise.resolve({}),
    isAdmin ? getPricingMaps() : Promise.resolve({ REGULAR: {}, ONE_TO_ONE: {} }),
    getAcademyProfile(),
    isAdmin ? listStudents() : Promise.resolve([]),
  ]);

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <SettingsShell
      initialUsers={users as any[]}
      currentUserId={user ? (user as { id: string }).id : ""}
      initialBatches={batches}
      initialGracePeriodMap={gracePeriodMap}
      initialPricingMaps={pricingMaps as any}
      initialProfile={academyProfile}
      userRole={userRole}
      signOutAction={signOutAction}
      students={JSON.parse(JSON.stringify(students))}
    />
  );
}


