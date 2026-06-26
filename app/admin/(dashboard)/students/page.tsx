import { redirect } from "next/navigation";
import { getSession, getSessionUser } from "@/lib/auth-session";
import StudentsListClient from "@/app/admin/_components/students/StudentsListClient";
import { listStudents, listBatches } from "@/lib/services/cached";

export default async function StudentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getSessionUser();
  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";

  const [students, batches] = await Promise.all([
    listStudents(),
    listBatches(),
  ]);

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <StudentsListClient
        canManage={canManage}
        students={JSON.parse(JSON.stringify(students))}
        batches={JSON.parse(JSON.stringify(batches))}
      />
    </div>
  );
}
