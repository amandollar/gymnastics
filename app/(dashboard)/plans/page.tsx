import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PlansPageClient from "@/components/plans/PlansPageClient";
import { getPricingMaps } from "@/lib/services/pricing";
import { listStudents } from "@/lib/services/students";

export default async function PlansPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as { role?: string })?.role;
  const canManage = role === "ADMIN" || role === "MANAGER";

  const [students, pricingMaps] = await Promise.all([
    listStudents(),
    getPricingMaps(),
  ]);

  const studentOptions = students.map((s) => ({
    id: s.id,
    name: s.name,
    studentNumber: s.studentNumber,
    status: s.status,
    parentName: s.parentName,
  }));

  return (
    <div className="mx-auto max-w-5xl min-w-0 w-full">
      <PlansPageClient
        isAdmin={role === "ADMIN"}
        canManage={canManage}
        pricingMaps={pricingMaps}
        students={JSON.parse(JSON.stringify(studentOptions))}
      />
    </div>
  );
}
