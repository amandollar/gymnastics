import { redirect } from "next/navigation";
import { getSession, getSessionUser } from "@/lib/auth-session";
import BulkUploadClient from "@/app/admin/_components/students/BulkUploadClient";

export default async function BulkUploadPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getSessionUser();
  const isAdmin = user?.role === "ADMIN";

  if (!isAdmin) {
    redirect("/admin/students");
  }

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <BulkUploadClient />
    </div>
  );
}
