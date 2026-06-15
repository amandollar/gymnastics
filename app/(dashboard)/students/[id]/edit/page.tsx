import { redirect, notFound } from "next/navigation";
import { getSession, getSessionUser } from "@/lib/auth-session";
import { getStudentById, getPricingMaps, getGracePeriodMap, listBatches } from "@/lib/services/cached";
import EditStudentForm from "@/components/students/EditStudentForm";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getSessionUser();
  if (user?.role !== "ADMIN" && user?.role !== "MANAGER") {
    redirect("/students");
  }

  const { id } = await params;
  const [student, pricingMaps, gracePeriodMap, batches] = await Promise.all([
    getStudentById(id),
    getPricingMaps(),
    getGracePeriodMap(),
    listBatches(),
  ]);
  
  if (!student) notFound();

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <EditStudentForm
        student={JSON.parse(JSON.stringify(student))}
        pricingMaps={JSON.parse(JSON.stringify(pricingMaps))}
        gracePeriodMap={JSON.parse(JSON.stringify(gracePeriodMap))}
        batches={JSON.parse(JSON.stringify(batches))}
      />
    </div>
  );
}
