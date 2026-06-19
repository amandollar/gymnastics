import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getStudentById } from "@/lib/services/cached";
import { getAcademyProfile } from "@/lib/services/academy";
import StudentIDCardClient from "@/components/students/StudentIDCardClient";

export default async function StudentIDCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const [student, academyProfile] = await Promise.all([
    getStudentById(id),
    getAcademyProfile(),
  ]);
  if (!student) notFound();

  return (
    <StudentIDCardClient
      student={JSON.parse(JSON.stringify(student))}
      academyProfile={JSON.parse(JSON.stringify(academyProfile))}
    />
  );
}
