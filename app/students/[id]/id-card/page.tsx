import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getStudentById } from "@/lib/services/students";
import StudentIDCardClient from "@/components/students/StudentIDCardClient";

export default async function StudentIDCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const student = await getStudentById(id);
  if (!student) notFound();

  return <StudentIDCardClient student={JSON.parse(JSON.stringify(student))} />;
}
