import { redirect, notFound } from "next/navigation";
import { getSession, getSessionUser } from "@/lib/auth-session";
import StudentDetailClient from "@/components/students/studentProfile";
import { getStudentById } from "@/lib/services/cached";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [{ id }, user] = await Promise.all([
    params,
    getSessionUser(),
  ]);

  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const student = await getStudentById(id);
  if (!student) notFound();

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <StudentDetailClient
        canManage={canManage}
        student={JSON.parse(JSON.stringify(student))}
      />
    </div>
  );
}
