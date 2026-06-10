import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PlansPageClient from "@/components/plans/PlansPageClient";
import { getPricingMaps } from "@/lib/services/pricing";
import { getGracePeriodMap } from "@/lib/services/grace-periods";
import { listStudents } from "@/lib/services/students";

export default async function PlansPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as { role?: string })?.role;
  const canManage = role === "ADMIN" || role === "MANAGER";

  const [students, pricingMaps, gracePeriodMap] = await Promise.all([
    listStudents(),
    getPricingMaps(),
    getGracePeriodMap(),
  ]);

  const studentOptions = students.map((s) => ({
    id: s.id,
    name: s.name,
    studentNumber: s.studentNumber,
    status: s.status,
    parentName: s.parentName,
    gender: s.gender,
    avatarUrl: s.avatarUrl,
  }));

  return (
    <div className="mx-auto max-w-5xl min-w-0 w-full">
      <PlansPageClient
        isAdmin={role === "ADMIN"}
        canManage={canManage}
        pricingMaps={pricingMaps}
        gracePeriodMap={gracePeriodMap}
        students={JSON.parse(JSON.stringify(studentOptions))}
      />
    </div>
  );
}
