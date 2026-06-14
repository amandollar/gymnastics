import { auth } from "@/auth";
import { redirect } from "next/navigation";
import StudentsListClient from "@/components/students/StudentsListClient";
import { listStudents } from "@/lib/services/students";
import { listBatches } from "@/lib/services/batches";

export default async function StudentsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as { role?: string })?.role;
  const canManage = role === "ADMIN" || role === "MANAGER";

  const [students, batches] = await Promise.all([
    listStudents(),
    listBatches(),
  ]);

  return (
    <div className="mx-auto max-w-6xl min-w-0 w-full">
      <StudentsListClient
        canManage={canManage}
        students={JSON.parse(JSON.stringify(students))}
        batches={JSON.parse(JSON.stringify(batches))}
      />
    </div>
  );
}
