import { redirect, notFound } from "next/navigation";
import { getSession, getSessionUser } from "@/lib/auth-session";
import StudentDetailClient from "@/components/students/StudentDetailClient";
import { getStudentById, getPricingMaps } from "@/lib/services/cached";

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ assignPlan?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [{ id }, { assignPlan }, user] = await Promise.all([
    params,
    searchParams,
    getSessionUser(),
  ]);

  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [student, pricingMaps] = await Promise.all([
    getStudentById(id),
    getPricingMaps(),
  ]);
  if (!student) notFound();

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <StudentDetailClient
        canManage={canManage}
        showAssignInitially={assignPlan === "1"}
        student={JSON.parse(JSON.stringify(student))}
        pricingMaps={pricingMaps}
      />
    </div>
  );
}
