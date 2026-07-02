import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-session";
import { getStudentById } from "@/lib/services/cached";
import AttendanceTab from "@/app/portal/_components/AttendanceTab";

export default async function AttendancePage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PARENT" || !user.id) {
    redirect("/parents/login");
  }

  const student = await getStudentById(user.id);
  if (!student) {
    redirect("/parents/login");
  }

  if (student.isTempPassword) {
    redirect("/parents/settings/change-password");
  }

  return <AttendanceTab student={JSON.parse(JSON.stringify(student))} />;
}
