import { redirect } from "next/navigation";
import { getSession, getSessionUser } from "@/lib/auth-session";
import AddStudentForm from "@/app/admin/_components/students/AddStudentForm";

export default async function NewStudentPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getSessionUser();
  if (user?.role !== "ADMIN" && user?.role !== "MANAGER") {
    redirect("/students");
  }

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <AddStudentForm />
    </div>
  );
}
