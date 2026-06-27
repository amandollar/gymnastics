import { redirect } from "next/navigation";
import { getSession, getSessionUser } from "@/lib/auth-session";
import { listStudents, listBatches } from "@/lib/services/cached";
import IDShirtClient from "@/app/admin/_components/students/IDShirtClient";

export const metadata = {
  title: "ID & Shirt – TAG",
  description: "Track and update student ID card and shirt provided status.",
};

export default async function IDShirtPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getSessionUser();
  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";
  if (!canManage) redirect("/students");

  const [rawStudents, batches] = await Promise.all([
    listStudents(),
    listBatches(),
  ]);

  // Serialize students and batches safely for client component use
  const students = JSON.parse(JSON.stringify(rawStudents));
  const serializedBatches = JSON.parse(JSON.stringify(batches));

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <IDShirtClient
        students={students}
        batches={serializedBatches}
      />
    </div>
  );
}
