import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getStudentById } from "@/lib/services/students";
import EditStudentForm from "@/components/students/EditStudentForm";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as { role?: string })?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    redirect("/students");
  }

  const { id } = await params;
  const student = await getStudentById(id);
  if (!student) notFound();

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <EditStudentForm student={JSON.parse(JSON.stringify(student))} />
    </div>
  );
}
