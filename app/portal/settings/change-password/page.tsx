import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-session";
import { getStudentById } from "@/lib/services/cached";
import ChangePasswordClient from "./ChangePasswordClient";

export default async function ChangePasswordPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PARENT" || !user.id) {
    redirect("/portal/login");
  }

  const student = await getStudentById(user.id);
  if (!student) {
    redirect("/portal/login");
  }

  return <ChangePasswordClient student={JSON.parse(JSON.stringify(student))} />;
}
