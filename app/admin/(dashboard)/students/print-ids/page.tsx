import { redirect } from "next/navigation";
import { getSession, getSessionUser } from "@/lib/auth-session";
import { listStudents, listBatches } from "@/lib/services/cached";
import { getAcademyProfile } from "@/lib/services/academy";
import PrintIDsClient from "@/components/students/PrintIDsClient";

export const metadata = {
  title: "Print ID Cards – TAG",
  description: "Bulk-print student ID cards with advanced filtering options.",
};

export default async function PrintIDsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getSessionUser();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";
  if (!canManage) redirect("/students");

  const [rawStudents, batches, academyProfile] = await Promise.all([
    listStudents(),
    listBatches(),
    getAcademyProfile(),
  ]);

  // Serialize and compute status for each student
  const students = JSON.parse(JSON.stringify(rawStudents));

  return (
    <PrintIDsClient
      students={students}
      batches={JSON.parse(JSON.stringify(batches))}
      academyProfile={JSON.parse(JSON.stringify(academyProfile))}
    />
  );
}
