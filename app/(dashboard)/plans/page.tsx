import { redirect } from "next/navigation";
import { getSession, getSessionUser } from "@/lib/auth-session";
import PlansPageClient from "@/components/plans/PlansPageClient";
import {
  listStudents,
  getPricingMaps,
  getGracePeriodMap,
  listBatches,
} from "@/lib/services/cached";

export default async function PlansPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getSessionUser();
  const role = user?.role;
  const canManage = role === "ADMIN" || role === "MANAGER";

  const [students, pricingMaps, gracePeriodMap, batches] = await Promise.all([
    listStudents(),
    getPricingMaps(),
    getGracePeriodMap(),
    listBatches(),
  ]);

  const studentOptions = students.map((s) => ({
    id: s.id,
    name: s.name,
    studentNumber: s.studentNumber,
    status: s.status,
    parentName: s.parentName,
    gender: s.gender,
    avatarUrl: s.avatarUrl,
    planEndsAt: (s as any).activePlan?.expiryDate
      ? new Date((s as any).activePlan.expiryDate).toISOString()
      : null,
  }));

  return (
    <div className="mx-auto max-w-5xl min-w-0 w-full">
      <PlansPageClient
        isAdmin={role === "ADMIN"}
        canManage={canManage}
        pricingMaps={pricingMaps}
        gracePeriodMap={gracePeriodMap}
        students={JSON.parse(JSON.stringify(studentOptions))}
        batches={JSON.parse(JSON.stringify(batches))}
      />
    </div>
  );
}
