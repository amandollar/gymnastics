import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import StudentDetailClient from "@/components/students/StudentDetailClient";
import { getStudentById } from "@/lib/services/students";
import { getPricingMaps } from "@/lib/services/pricing";

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ assignPlan?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const { assignPlan } = await searchParams;
  const role = (session.user as { role?: string })?.role;
  const canManage = role === "ADMIN" || role === "MANAGER";

  const [student, pricingMaps] = await Promise.all([
    getStudentById(id),
    getPricingMaps(),
  ]);
  if (!student) notFound();

  return (
    <div className="mx-auto max-w-4xl min-w-0 w-full">
      <StudentDetailClient
        canManage={canManage}
        showAssignInitially={assignPlan === "1"}
        student={JSON.parse(JSON.stringify(student))}
        pricingMaps={pricingMaps}
      />
    </div>
  );
}
