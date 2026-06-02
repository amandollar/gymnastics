import { auth } from "@/auth";
import { redirect } from "next/navigation";
import BulkUploadClient from "@/components/students/BulkUploadClient";

export default async function BulkUploadPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as { role?: string })?.role;
  const canManage = role === "ADMIN" || role === "MANAGER";

  if (!canManage) {
    redirect("/students");
  }

  return (
    <div className="mx-auto max-w-7xl min-w-0 w-full">
      <BulkUploadClient />
    </div>
  );
}
