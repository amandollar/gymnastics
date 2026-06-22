import { redirect } from "next/navigation";
import { getSession, getSessionUser } from "@/lib/auth-session";
import EnquiryListClient from "@/app/admin/_components/enquiries/EnquiryListClient";
import { listEnquiries } from "@/lib/services/cached";

export default async function EnquiriesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getSessionUser();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const enquiries = await listEnquiries();

  return (
    <div className="mx-auto max-w-6xl min-w-0 w-full">
      <EnquiryListClient
        canManage={canManage}
        enquiries={JSON.parse(JSON.stringify(enquiries))}
      />
    </div>
  );
}
