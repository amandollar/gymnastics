import { redirect } from "next/navigation";
import { getSession, getSessionUser } from "@/lib/auth-session";
import BulkUploadClient from "@/components/students/BulkUploadClient";

export default async function BulkUploadPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getSessionUser();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  if (!canManage) {
    redirect("/students");
  }

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <BulkUploadClient />
    </div>
  );
}
