import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AddStudentForm from "@/components/students/AddStudentForm";

export default async function NewStudentPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as { role?: string })?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    redirect("/students");
  }

  return (
    <div className="mx-auto max-w-2xl min-w-0 w-full">
      <AddStudentForm />
    </div>
  );
}
