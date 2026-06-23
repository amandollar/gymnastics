import { redirect, notFound } from "next/navigation";
import { getSession, getSessionUser } from "@/lib/auth-session";
import { getStudentById, getPricingMaps, getGracePeriodMap, listBatches, listCoaches } from "@/lib/services/cached";
import EditStudentForm from "@/app/admin/_components/students/EditStudentForm";
import { computeStudentStatus } from "@/lib/utils/student";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getSessionUser();
  if (user?.role !== "ADMIN" && user?.role !== "STAFF") {
    redirect("/students");
  }

  const { id } = await params;
  const [student, pricingMaps, gracePeriodMap, batches, coaches] = await Promise.all([
    getStudentById(id),
    getPricingMaps(),
    getGracePeriodMap(),
    listBatches(),
    listCoaches({ status: "WORKING", role: "COACH" }),
  ]);
  
  if (!student) notFound();

  // Compute plan status server-side so UpdatePlanTab can decide what to show
  const activePlan = (student as any).activePlan;
  const planStatus = computeStudentStatus(
    activePlan
      ? {
          sessionsCompleted: activePlan.sessionsCompleted,
          totalSessions: activePlan.totalSessions,
          endDate: activePlan.endDate,
          expiryDate: activePlan.expiryDate,
          freezeStartDate: activePlan.freezeStartDate,
          freezeEndDate: activePlan.freezeEndDate,
          freezePeriods: activePlan.freezePeriods,
          lastAttendanceDate: null,
        }
      : null
  );

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <EditStudentForm
        student={JSON.parse(JSON.stringify(student))}
        pricingMaps={JSON.parse(JSON.stringify(pricingMaps))}
        gracePeriodMap={JSON.parse(JSON.stringify(gracePeriodMap))}
        batches={JSON.parse(JSON.stringify(batches))}
        coaches={JSON.parse(JSON.stringify(coaches))}
        planStatus={planStatus}
      />
    </div>
  );
}
